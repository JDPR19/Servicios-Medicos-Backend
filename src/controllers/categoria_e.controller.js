const pool = require('../config/db');
const { registrarBitacora } = require('../helpers/registerBitacora');

const getAllCategoriaE = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM categoria_e ORDER BY id DESC');
        return res.json(result.rows);
    } catch(error) {
        console.error('Error al Solicitar todos las categorias', error);
        next();
    }
};

const getCategoriaE = async (req, res, next) => {
    const { id } = req.params;
    try{
        const result = await pool.query('SELECT * FROM categoria_e  WHERE id = $1 ', [id]);
    if(result.rows.length === 0){
        return res.status(404).json({
            message: 'Error categoria no encontrado o no existe'
        });
    };
        return res.json(result.rows[0]);
    
    } catch (error) {
        console.error(`Error al obtener la Categoria con id: ${id}`, error);
        next();
    }
};

const createCategoriaE = async (req, res, next) => {
    const { id } = req.params;
    try{
        const { nombre } = req.body;

        const result = await pool.query('INSERT INTO categoria_e  (nombre) VALUES ($1) RETURNING *', [nombre]);
        
        await registrarBitacora ({
            accion: 'Registro',
            tabla: 'Categorias de Enfermedades',
            usuario: req.user.username,
            usuarios_id: req.user.id,
            descripcion: `Se creo la Categoria: ${nombre}`,
            datos:{nuevos: result.rows[0]}
        });

        return res.status(201).json(result.rows[0]);
    }catch (error) {
        console.error('Error al registrar la Categoria', error);
        next();
    }
}

const updateCategoriaE = async (req, res, next) => {
    const { id } = req.params

    try{
        const { nombre } = req.body;

        const oldCategoriaE = await pool.query('SELECT * FROM categoria_e  WHERE id = $1', [id]);

        const result = await pool.query('UPDATE categoria_e  SET nombre = $1 WHERE id = $2 RETURNING *' ,[nombre, id]); 

        if(result.rows.length === 0){
            return res.status(404).json({
                message: '--->Error Solicitud no existe o es imposible de encontrar<---'
            });
        };

        await registrarBitacora({
            accion: 'Actualizo',
            tabla: 'Categoria de Enfermedades',
            usuario: req.user.username,
            usuarios_id: req.user.id,
            descripcion: `Se actualizo la Categoria con nombre: ${nombre}`,
            datos:{antiguos: oldCategoriaE.rows[0], nuevos: result.rows[0]}
        });
        
        return res.json(result.rows[0]);
    } catch (error) {
        console.error(`Error al Actualizar Categoria con id: ${id}`);
        next();
    }
};

const deleteCategoriaE = async (req, res, next) => {
    const { id } = req.params;

    const oldCategoriaE = await pool.query('SELECT * FROM categoria_e  WHERE id = $1', [id]);

    try{
        const result = await pool.query('DELETE FROM categoria_e  WHERE id = $1', [id]);
        
        if(result.rowCount === 0) {
            return res.status(404).json({
                message: 'Error Solicitud no se encuentra o es inexistente'
            });
        };

        await registrarBitacora({
            accion:'Elimino',
            tabla: 'Categoria de Enfermedades',
            usuario: req.user.username,
            usuarios_id: req.user.id,
            descripcion: `Se elimino la Categoria ${oldCategoriaE.rows[0]?.nombre || id}`,
            datos: {antiguos: oldCategoriaE.rows[0]}
        });

        return res.sendStatus(204);
    } catch (error) {
        console.error(`Error al eliminar la Categoria con id: ${id}`, error);
        next();
    }
};

module.exports = {
    getAllCategoriaE,
    getCategoriaE,
    createCategoriaE,
    updateCategoriaE,
    deleteCategoriaE
};