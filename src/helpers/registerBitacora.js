const pool = require('../config/db');

///// REGISTRAR ACCIONES EN LA BITACORA//////////////

/** 
* @param {Object} params 
* @param {String} params.accion 
* @param {String} params.tabla
* @param {String} params.usuario
* @param {String} params.descripcion
* @param {Object} [params.datos]
* @param {Number} [params.usuario_id]
*/
async function registrarBitacora({accion, tabla, usuario, descripcion, datos = null, usuarios_id = null}) {
    await pool.query(
        `INSERT INTO bitacora (fecha, accion, tabla, usuario, descripcion, datos, usuarios_id)
        VALUES (NOW()::timestamp(0), $1, $2, $3, $4, $5, $6)`,
    [accion, tabla, usuario, descripcion, datos ? JSON.stringify(datos) : null, usuarios_id]);
}

module.exports = { registrarBitacora };