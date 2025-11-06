const pool = require('../config/db');
const bcrypt = require('bcrypt');


const getAllUsuarios = async (req, res, next) => {
    try {
    const result = await pool.query(`
        SELECT 
        u.*,
        d.id       AS doctor_id,
        d.cedula   AS doctor_cedula,
        d.nombre   AS doctor_nombre,
        d.apellido AS doctor_apellido,
        r.id       AS rol_id,
        r.nombre   AS rol_nombre
        FROM usuarios u
        LEFT JOIN doctor d ON u.doctor_id = d.id
        LEFT JOIN roles  r ON u.roles_id  = r.id
        ORDER BY u.id DESC
    `);
    return res.status(200).json(result.rows);
    } catch (error) {
    console.error('Error al obtener todos los usuarios', error);
    next(error);
    }
};

const getUsuario = async (req, res, next) => {
    const { id } = req.params;
        try {
        const result = await pool.query(`
            SELECT u.*,
                dc.id AS doctor_id,
                dc.cedula AS doctor_cedula,
                dc.nombre AS doctor_nombre,
                dc.apellido AS doctor_apellido,
                dc.contacto AS doctor_contacto,
                c.id AS cargo_id,
                c.nombre AS cargo_nombre,
                p.id AS cargo_id,
                p.carrera AS profesion_carrera,
                p.nivel AS profesion_nivel,
                r.id AS roles_id,
                r.nombre AS roles_nombre
            FROM usuarios u
            LEFT JOIN doctor dc ON u.doctor_id  = dc.id
            LEFT JOIN roles r ON u.roles_id = r.id
            LEFT JOIN cargos c ON dc.cargos_id = c.id 
            LEFT JOIN profesion p ON dc.profesion_id = p.id
            WHERE u.id = $1 AND u.estado = TRUE
            `, [id]);

            if(result.rows.length === 0){
                return res.status(404).json({
                    message: 'Error en la solicitud --> No puede ser encontrada o no existe'
                });
            }
            return res.status(200).json(result.rows[0]);
     } catch (error) {
        console.error(`Error al obtener el usuario con id: ${id}`, error);
        next();
     }
};

const createUsuario = async (req, res, next) => {
    try {
        const {username, correo, password, roles_id, doctor_id} = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        if (!doctor_id || !Number.isInteger(Number(doctor_id))) {
            return res.status(400).json({ message: "el doctor es obligatorio " });
            }
        if (!roles_id || !Number.isInteger(Number(roles_id))) {
            return res.status(400).json({ message: "el Rol es obligatoria " });
            }

        const result = await pool.query('INSERT INTO usuarios (username, correo, password, roles_id, doctor_id, estado) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *', 
            [username, correo, hashedPassword, roles_id, doctor_id]);

            return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al registrar usuario', error);
        next();
    }
};

const updateUsuario = async (req, res, next) => {
    const { id } = req.params;

    try {
        const {username, correo, password, roles_id, doctor_id, estado}= req.body;

        let hashedPassword;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            } else {
                const current = await pool.query('SELECT password FROM usuarios WHERE id = $1', [id]);
                hashedPassword = current.rows[0]?.password;
            }


        const result = await pool.query(`
            UPDATE usuarios SET username = $1, correo = $2, password = $3, roles_id = $4, doctor_id = $5, estado = $6 
            WHERE id = $7 RETURNING * 
            `, 
            [username, correo, hashedPassword, roles_id, doctor_id, estado, id]);

            if(result.rows.length === 0){
                return res.status(404).json({
                    message: 'El usuario no fue encontrado o no se pudo actualizar'
                });
            }

            return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(`Error al actualizar el usuario con id: ${id}`);
        next();
    }
};

const deleteUsuario = async (req, res, next) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado o ya eliminado' });
        }

        return res.sendStatus(204);
    } catch (error) {
        console.error(`error al eliminar el usuario con id: ${id}`, error);
        next();
    }
};

const getDoctores = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT id, cedula, nombre, apellido FROM doctor WHERE estado = TRUE ORDER BY cedula DESC');
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('error al obtener todas las cedulas',error);
        next();
    }
};

const getRoles = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT id, nombre, permisos FROM roles ORDER BY nombre DESC');
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('error al obtener todos los roles',error);
        next();
    }
};

const getProfesiones = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM porfesion ORDER BY nombre DESC');
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener todas las profesiones', error);
        next();
    }
};


const getCargos = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM cargos ORDER BY nombre DESC');
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error obteniendo a todos los cargos', error);
        next();
    }
};


module.exports = {
    getAllUsuarios,
    getUsuario,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    getDoctores,
    getCargos,
    getRoles,
    getProfesiones
}