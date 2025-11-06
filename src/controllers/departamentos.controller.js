const pool = require('../config/db');
const { registrarBitacora } = require('../helpers/registerBitacora');

const getAllDepartamentos = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM departamentos ORDER BY id DESC'); 
        
        const departamentos = result.rows;

        for (const depar of departamentos) {
            const finalidadRes = await pool.query(`
                SELECT f.id, f.nombre AS nombre_finalidad, fd.objetivo AS objetivo_finalidad
                FROM finalidad_departamentos fd 
                JOIN finalidades f ON fd.finalidades_id = f.id
                WHERE fd.departamentos_id = $1
            `, [depar.id]);

            depar.finalidad_detalle = finalidadRes.rows.map(f => 
                `${f.nombre_finalidad} (Objetivo: ${f.objetivo_finalidad})`
            ).join('<br>');

            depar.finalidades = finalidadRes.rows;
        }

        return res.json(departamentos);
    } catch (error) {
        console.error('Error al obtener departamentos:', error);
        next(error);
    }
};

const getDepartamentos = async (req, res, next) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM departamentos WHERE id = $1', [id]);

        if(result.rows.length === 0) {
            return res.status(404).json({
                message: 'departamento no encontrado'
            });
        }

        const departamentos = result.rows[0];

        const depar_finalidad = await pool.query(`
            SELECT f.id, f.nombre AS nombre_finalidad, fd.objetivo AS objetivo_finalidad
            FROM finalidad_departamentos fd
            JOIN finalidades f ON fd.finalidades_id = f.id
            WHERE fd.departamentos_id = $1`, [departamentos.id]);

        departamentos.detalle = depar_finalidad.rows;

        return res.json(departamentos);
    } catch (error) {
        console.error(`Error al obtener el departamento con id: ${id}`, error);
        next();
    }
};

const createDepartamentos = async (req, res, next) => {
    const { nombre, descripcion, finalidades_ids } = req.body;
    const client = await pool.connect(); 
    try {
        await client.query('BEGIN');

        const result = await client.query('INSERT INTO departamentos (nombre, descripcion) VALUES ($1, $2) RETURNING *', [nombre, descripcion]);

        const departamentosId = result.rows[0].id;

        if (Array.isArray(finalidades_ids)){
            for(const fin of finalidades_ids){
                await client.query('INSERT INTO finalidad_departamentos (departamentos_id, finalidades_id, objetivo)  VALUES ($1, $2, $3) RETURNING *', 
                    [departamentosId, fin.finalidad_id, fin.objetivo])
            };
        }

        await registrarBitacora({
            accion: 'Registro',
            tabla: 'Departamentos',
            usuario: req.user.username,
            usuarios_id: req.user.id,
            descripcion: `Se Creo un departamento con nombre: ${nombre}`,
            datos: {nuevos: result.rows[0]}
        });

        await client.query('COMMIT');
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al registrar departamento', error);
        next();
    }finally {
        client.release();
    }
};

const updateDepartamentos = async (req, res, next) => {
    const { id } = req.params;
    const { nombre, descripcion, finalidades_ids } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
            const oldDepartamentos = await client.query('SELECT * FROM departamentos WHERE id = $1', [id]);

            const result = await client.query('UPDATE departamentos SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *', [nombre, descripcion, id]);

            await client.query('DELETE FROM finalidad_departamentos WHERE departamentos_id = $1', [id]);
            if(Array.isArray(finalidades_ids)){
                for(const fin of finalidades_ids){
                    await client.query('INSERT INTO finalidad_departamentos (departamentos_id, finalidades_id, objetivo) VALUES ($1, $2, $3) RETURNING *', 
                        [id, fin.finalidades_id, fin.objetivo]);
                }
            }

            await registrarBitacora({
                accion: 'Actualizar',
                tabla: 'Departamentos',
                usuario: req.user.username,
                usuarios_id: req.user.id,
                descripcion: `Se Actualizo el departamento con nombre: ${nombre}`,
                datos: {antiguos: oldDepartamentos.rows[0], nuevos: result.rows[0]}
            });

        await client.query('COMMIT');
        return res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error al Actualizar el Departamento con id: ${id}`);
        next();
    } finally {
        client.release();
    }
};

const deleteDepartamentos  = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM finalidad_departamentos WHERE departamentos_id = $1', [id]);
        const oldDepartamentos = await client.query('SELECT * FROM departamentos WHERE id = $1',[id]);
        const result = await client.query('DELETE FROM departamentos WHERE id = $1', [id]);

        if(result.rowCount === 0) {
            return res.status(404).json({
                message: 'Error Solicitud no se encuentra o es inexistente'
            });
        };

        await registrarBitacora({
            accion: 'ELIMINO',
            tabla: 'Departamentos',
            usuario: req.user.username,
            usuarios_id: req.user.id,
            descripcion: `Se eliminó el Departamento ${oldDepartamentos.rows[0]?.nombre || id}`,
            dato: { antiguos: oldDepartamentos.rows[0] }
        });

        await client.query('COMMIT');
        return res.sendStatus(204);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error eliminado Departamento:', error);
        next(error);
    }finally {
        client.release();
    }
};

const getFinalidades = async (req, res, next) => {
    try{
        const result = await pool.query('SELECT id, nombre FROM finalidades ORDER BY nombre ASC');
        return res.json(result.rows);
    }catch(error) {
        console.error('Error al obtener las finalidades', error);
        next();
    }
};

module.exports = {
    getAllDepartamentos,
    getDepartamentos,
    createDepartamentos,
    updateDepartamentos,
    deleteDepartamentos,
    getFinalidades
};