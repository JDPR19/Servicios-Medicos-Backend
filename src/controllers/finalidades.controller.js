const pool = require('../config/db');
const { registrarBitacora } = require('../helpers/registerBitacora');

const getAllFinalidades = async (req, res, next) => {
    try{
        const result = await pool.query('SELECT * FROM finalidades ORDER BY id DESC');
        
    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'No se encontraron finalidades' });
    }

        return res.json(result.rows);
    } catch(error) {
        console.error('Error al Obtener todas las finalidades', error);
        next();
    }
};

const getFinalidades = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM finalidades WHERE id = $1', [id]);

        if(result.rows.length === 0){
            return res.status(404).json({
                message: '--> Error <-- La Solicitud no puede ser encontrada o no existe'
            });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error(`Error al Obtener la Finalidad con la id: ${id}`);
        next();
    }
};

const createFinalidades = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { nombre } = req.body;  
        
        const repet = await pool.query(`SELECT 1 FROM finalidades WHERE nombre = $1`, [nombre]);

        if(repet.rowCount > 0) {
            return res.status(400).json({message: 'Ya existe una finalidad con ese nombre'});
        }

        const result = await pool.query('INSERT INTO finalidades (nombre) VALUES ($1) RETURNING *', [nombre]);

        await registrarBitacora({
            accion: 'Registro',
            tabla: 'Finalidades',
            usuario: req.user.username,
            usuarios_id: req.user.id,
            descripcion: `Se creo una Finalidad con ${nombre}`,
            datos: {nuevos: result.rows[0]}
        });
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error en el Registro de la Finalidad', error);
        next();
    }
};

const updateFinalidades = async (req, res, next) => {
    const { id } = req.params;

    try {

    const { nombre } = req.body

        const oldFinalidades = await pool.query('SELECT * FROM finalidades WHERE id = $1', [id]);

        const result = await pool.query('UPDATE finalidades SET nombre = $1 WHERE id = $2 RETURNING *', [nombre, id]);

        await registrarBitacora({
            accion: 'Actualizo',
            tabla: 'Finalidades',
            usuario: req.user.username,
            usuarios_id: req.user.id,
            descripcion: `Se Actualizo la finalidad con nombre: ${nombre}`,
            datos: { antiguos: oldFinalidades.rows[0], nuevos: result.rows[0]}
        });

        return res.status(201).json(result.rows[0]);
    }catch (error){
        console.error(`Error al Actualizar la finalidad con id: ${id}`, error);
        next();
    }
};

const deleteFinalidades = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const oldFinalidades = await pool.query('SELECT * FROM finalidades WHERE id = $1', [id]);
        
        const result = await pool.query('DELETE FROM finalidades WHERE id = $1', [id]);

        if(result.rowCount === 0){
            return res.status(404).json({
                message: '-->Error<-- la solicitud no puede ser encontrada o esta es inexisten'
            });
        }

        await registrarBitacora({
            accion: 'Elimino',
            tabla: 'Finalidades',
            usuario: req.user.username,
            usuarios_id: req.user.id,
            descripcion: `Se elimino la Finalidad ${oldFinalidades.rows[0]?.nombre || id}`,
            datos: { antiguos:oldFinalidades.rows[0]}
        });
        return res.sendStatus(204);
        
    } catch (error) {
        console.error('Error al Eliminar la Finalidad', error);
        next();
    }
};

module.exports = {
    getAllFinalidades,
    getFinalidades,
    createFinalidades,
    updateFinalidades,
    deleteFinalidades
}