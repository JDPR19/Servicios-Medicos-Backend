const pool = require('../config/db');
const { registrarBitacora } = require('../helpers/registerBitacora');

const getAllCargo = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM cargos ORDER BY id DESC');
        return res.json(result.rows);
    } catch(error) {
        console.error('Error al Solicitar todos los cargos', error);
        next();
    }
};

const getCargo = async (req, res, next) => {
    const { id } = req.params;
    try{
        const result = await pool.query('SELECT * FROM cargos WHERE id = $1 ', [id]);
    if(result.rows.length === 0){
        return res.status(404).json({
            message: 'Error el cargo no encontrado o no existe'
        });
    };
        return res.json(result.rows[0]);
    
    } catch (error) {
        console.error(`Error al obtener el cargo con id: ${id}`, error);
        next();
    }
};

const createCargo = async (req, res, next) => {
    const { id } = req.params;
    try{
        const { nombre } = req.body;

        const result = await pool.query('INSERT INTO cargos (nombre) VALUES ($1) RETURNING *', [nombre]);
        
        await registrarBitacora ({
            accion: 'Registro',
            tabla: 'Cargos',
            usuario: req.user.username,
            usuarios_id: req.user.id,
            descripcion: `Se creo el cargo: ${nombre}`,
            datos:{nuevos: result.rows[0]}
        });

        return res.status(201).json(result.rows[0]);
    }catch (error) {
        console.error('Error al registrar el Cargo', error);
        next();
    }
}

const updateCargo = async (req, res, next) => {
    const { id } = req.params

    try{
        const { nombre } = req.body;

        const oldCargo = await pool.query('SELECT * FROM cargos WHERE id = $1', [id]);

        const result = await pool.query('UPDATE cargos SET nombre = $1 WHERE id = $2 RETURNING *' ,[nombre, id]); 

        if(result.rows.length === 0){
            return res.status(404).json({
                message: '--->Error Solicitud no existe o es imposible de encontrar<---'
            });
        };

        await registrarBitacora({
            accion: 'Actualizo',
            tabla: 'Cargos',
            usuario: req.user.username,
            usuarios_id: req.user.id,
            descripcion: `Se actualizo el Cargo con nombre: ${nombre}`,
            datos:{antiguos: oldCargo.rows[0], nuevos: result.rows[0]}
        });
        
        return res.json(result.rows[0]);
    } catch (error) {
        console.error(`Error al Actualizar Cargo con id: ${id}`);
        next();
    }
};

const deleteCargo = async (req, res, next) => {
    const { id } = req.params;

    const oldCargo = await pool.query('SELECT * FROM cargos WHERE id = $1', [id]);

    try{
        const result = await pool.query('DELETE FROM cargos WHERE id = $1', [id]);
        
        if(result.rowCount === 0) {
            return res.status(404).json({
                message: 'Error Solicitud no se encuentra o es inexistente'
            });
        };

        await registrarBitacora({
            accion:'Elimino',
            tabla: 'Cargos',
            usuario: req.user.username,
            usuarios_id: req.user.id,
            descripcion: `Se elimino el Cargo ${oldCargo.rows[0]?.nombre || id}`,
            datos: {antiguos: oldCargo.rows[0]}
        });

        return res.sendStatus(204);
    } catch (error) {
        console.error(`Error al eliminar el Cargo con id: ${id}`, error);
        next();
    }
};

module.exports = {
    getAllCargo,
    getCargo,
    createCargo,
    updateCargo,
    deleteCargo
};