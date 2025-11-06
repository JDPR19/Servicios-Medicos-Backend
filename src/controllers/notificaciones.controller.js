const pool = require('../db');

const getNotificacionesByUsuario = async (req, res) => {
  try {
    const usuario_id = req.user?.id || parseInt(req.query.usuario_id, 10);
    if (!usuario_id) return res.status(400).json({ error: 'usuario_id requerido' });

    const result = await pool.query(
      `SELECT id, mensaje, leida, usuario_id, planificacion_id, solicitud_id, inspeccion_est_id, tipo, created_at
       FROM notificaciones
       WHERE usuario_id = $1
       ORDER BY created_at DESC`,
      [usuario_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las notificaciones' });
  }
};

const marcarLeida = async (req, res, next) => {
    const { id } = req.params;
    try {
        await pool.query(
            `UPDATE notificaciones SET leida = TRUE WHERE id = $1`,
            [id]
        );
        res.sendStatus(200);
    } catch (error) {
        console.error('Error marcando notificación como leída:', error);
        next(error);
    }
};


const getSolicitudById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        s.*, 
        TO_CHAR(s.fecha_solicitada, 'YYYY-MM-DD') AS fecha_solicitada,
        TO_CHAR(s.fecha_resolucion, 'YYYY-MM-DD') AS fecha_resolucion,
        ts.nombre AS tipo_solicitud_nombre,
        u.username AS usuario_username,
        p.nombre AS propiedad_nombre,
        p.rif AS propiedad_rif,
        p.hectareas AS propiedad_hectareas,
        p.ubicacion AS propiedad_ubicacion,
        p.posee_certificado
      FROM solicitud s
      LEFT JOIN tipo_solicitud ts ON s.tipo_solicitud_id = ts.id
      LEFT JOIN usuarios u ON s.usuario_id = u.id
      LEFT JOIN propiedad p ON s.propiedad_id = p.id
      WHERE s.id = $1
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la solicitud' });
  }
};

const getPlanificacionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        p.*, 
        TO_CHAR(p.fecha_programada, 'YYYY-MM-DD') AS fecha_programada,
        s.descripcion AS solicitud_descripcion,
        s.codigo AS solicitud_codigo,
        s.estado AS solicitud_estado
      FROM planificacion p
      INNER JOIN solicitud s ON p.solicitud_id = s.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Planificación no encontrada' });

    const planificacion = result.rows[0];
    const empleadosRes = await pool.query(`
      SELECT e.id, e.nombre, e.apellido, e.cedula, c.nombre AS cargo
      FROM planificacion_empleado pe
      JOIN empleados e ON pe.empleado_id = e.id
      LEFT JOIN cargo c ON e.cargo_id = c.id
      WHERE pe.planificacion_id = $1
    `, [planificacion.id]);
    planificacion.empleados = empleadosRes.rows;

    res.json(planificacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la planificación' });
  }
};

// NUEVO: detalle de inspección para el modal
const getInspeccionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        ie.*,
        TO_CHAR(ie.fecha_inspeccion, 'YYYY-MM-DD') AS fecha_inspeccion,
        plan.id     AS planificacion_id,
        plan.codigo AS planificacion_codigo,
        sol.id      AS solicitud_id,
        sol.codigo  AS solicitud_codigo,
        prop.id     AS propiedad_id,
        prop.nombre AS propiedad_nombre,
        prop.ubicacion AS propiedad_ubicacion,
        prop.rif    AS propiedad_rif,
        (
          SELECT COALESCE(
            json_agg(json_build_object('id', ii.id, 'imagen', ii.imagen)) FILTER (WHERE ii.id IS NOT NULL),
            '[]'::json
          )
          FROM inspeccion_imagen ii
          WHERE ii.inspeccion_est_id = ie.id
        ) AS imagenes,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object('id', fi.id, 'finalidad_id', fi.finalidad_id, 'finalidad', fc.nombre, 'objetivo', fi.objetivo)
            ) FILTER (WHERE fi.id IS NOT NULL),
            '[]'::json
          )
          FROM finalidad_inspeccion fi
          JOIN finalidad_catalogo fc ON fi.finalidad_id = fc.id
          WHERE fi.inspeccion_est_id = ie.id
        ) AS finalidades
      FROM inspeccion_est ie
      LEFT JOIN planificacion plan ON ie.planificacion_id = plan.id
      LEFT JOIN solicitud sol ON plan.solicitud_id = sol.id
      LEFT JOIN propiedad prop ON sol.propiedad_id = prop.id
      WHERE ie.id = $1
      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Inspección no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la inspección' });
  }
};

module.exports = {
getNotificacionesByUsuario,
marcarLeida,
getSolicitudById,
getPlanificacionById,
getInspeccionById
};