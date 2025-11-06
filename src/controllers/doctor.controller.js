const pool = require('../config/db');
const { registrarBitacora } = require('../helpers/registerBitacora');

const getAllDoctores = async (req, res, next) => {
try {
    const result = await pool.query(`
    SELECT 
        d.id, d.cedula, d.nombre, d.apellido, d.contacto, d.cargos_id, d.profesion_id, d.estado, d.created_at, d.updated_at,
        c.id AS cargo_id, c.nombre AS cargo_nombre,
        p.id AS profesion_id, p.carrera AS profesion_carrera, p.nivel AS profesion_nivel
    FROM doctor d
    LEFT JOIN cargos c     ON d.cargos_id   = c.id
    LEFT JOIN profesion p  ON d.profesion_id = p.id
    ORDER BY d.nombre ASC;
    `);
    return res.status(200).json(result.rows);
} catch (error) {
    console.error('Error al obtener doctores', error);
    return next(error);
}
};

const getDoctor = async (req, res, next) => {
const { id } = req.params;
try {
    const result = await pool.query(`
    SELECT 
        d.id, d.cedula, d.nombre, d.apellido, d.contacto, d.cargos_id, d.profesion_id, d.estado, d.created_at, d.updated_at,
        c.nombre AS cargo_nombre,
        p.carrera AS profesion_carrera, p.nivel AS profesion_nivel
    FROM doctor d
    LEFT JOIN cargos c    ON d.cargos_id    = c.id
    LEFT JOIN profesion p ON d.profesion_id = p.id
    WHERE d.id = $1
    LIMIT 1;
    `, [id]);

    if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Doctor no encontrado' });
    }
    return res.status(200).json(result.rows[0]);
} catch (error) {
    console.error(`Error al obtener doctor ${id}`, error);
    return next(error);
}
};

const getCargos = async (_req, res, next) => {
try {
    const result = await pool.query('SELECT id, nombre FROM cargos ORDER BY nombre ASC');
    return res.status(200).json(result.rows);
} catch (error) {
    console.error('Error al obtener cargos', error);
    return next(error);
}
};

const getProfesion = async (_req, res, next) => {
try {
    const result = await pool.query('SELECT id, carrera, nivel FROM profesion ORDER BY carrera ASC');
    return res.status(200).json(result.rows);
} catch (error) {
    console.error('Error al obtener profesiones', error);
    return next(error);
}
};

const createDoctor = async (req, res, next) => {
try {
    const { cedula, nombre, apellido, contacto, cargos_id, profesion_id } = req.body;

    const existe = await pool.query('SELECT id FROM doctor WHERE cedula = $1 LIMIT 1', [cedula]);
    if (existe.rows.length > 0) {
    return res.status(409).json({ message: 'La cédula ya existe' });
    }

    if (!cargos_id || !Number.isInteger(Number(cargos_id))) {
    return res.status(400).json({ message: "El cargo es obligatorio " });
    }
    if (!profesion_id || !Number.isInteger(Number(profesion_id))) {
    return res.status(400).json({ message: "La profesión es obligatoria " });
    }

    const result = await pool.query(`
    INSERT INTO doctor (cedula, nombre, apellido, contacto, cargos_id, profesion_id, estado)
    VALUES ($1, $2, $3, $4, $5, $6, TRUE)
    RETURNING *;
    `, [cedula, nombre, apellido, contacto, cargos_id, profesion_id]);

    await registrarBitacora?.({
    accion: 'Registrar',
    tabla: 'Doctores',
    usuario: req.user?.username,
    usuarios_id: req.user?.id,
    descripcion: `Se registró el doctor: ${nombre} ${apellido}`,
    datos: { nuevos: result.rows[0] }
    });

    return res.status(201).json(result.rows[0]);
} catch (error) {
    console.error('Error al registrar doctor', error);
    return next(error);
}
};

const updateDoctor = async (req, res, next) => {
const { id } = req.params;
try {
    const { cedula, nombre, apellido, contacto, cargos_id, profesion_id, estado } = req.body;

    const oldDoctor = await pool.query('SELECT * FROM doctor WHERE id = $1', [id]);
    if (oldDoctor.rows.length === 0) {
    return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    const existe = await pool.query('SELECT id FROM doctor WHERE cedula = $1 AND id <> $2', [cedula, id]);
    if (existe.rows.length > 0) {
    return res.status(409).json({ message: 'La cédula ya existe' });
    }

    const result = await pool.query(`
    UPDATE doctor
    SET cedula = $1,
        nombre = $2,
        apellido = $3,
        contacto = $4,
        cargos_id = $5,
        profesion_id = $6,
        estado = $7,
        updated_at = NOW()
    WHERE id = $8
    RETURNING *;
    `, [cedula, nombre, apellido, contacto, cargos_id, profesion_id, estado, id]);

    await registrarBitacora?.({
    accion: 'Actualizar',
    tabla: 'Doctores',
    usuario: req.user?.username,
    usuarios_id: req.user?.id,
    descripcion: `Se actualizó el doctor con id: ${id}`,
    datos: { antiguos: oldDoctor.rows[0], nuevos: result.rows[0] }
    });

    return res.status(200).json(result.rows[0]);
} catch (error) {
    console.error(`Error al actualizar doctor ${id}`, error);
    return next(error);
}
};

const deleteDoctor = async (req, res, next) => {
const { id } = req.params;
try {
    const oldDoctor = await pool.query('SELECT * FROM doctor WHERE id = $1', [id]);

    const result = await pool.query('DELETE FROM doctor WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    await registrarBitacora?.({
    accion: 'Eliminar',
    tabla: 'Doctores',
    usuario: req.user?.username,
    usuarios_id: req.user?.id,
    descripcion: `Se eliminó el doctor con id: ${id}`,
    datos: { antiguos: oldDoctor.rows[0] }
    });

    return res.sendStatus(204);
} catch (error) {
    console.error(`Error al eliminar doctor ${id}`, error);
    return next(error);
}
};

module.exports = {
getAllDoctores,
getDoctor,
createDoctor,
updateDoctor,
deleteDoctor,
getCargos,
getProfesion
};