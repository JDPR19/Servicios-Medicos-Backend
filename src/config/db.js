const { Pool } = require('pg');
const { db } = require('./config');

const pool = new Pool({
    user: db.user,
    password: db.password,
    host: db.host,
    port: db.port,
    database: db.database,
});

////////// PRUEBA DE CONEXION A LA BASE DE DATOS //////////

console.log('Conectando a la base de datos:', db);

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error al Conectar a la Base de Datos:', err);
    } else {
        console.error('Conexión exitosa a PostgreSQL:', res.rows[0].now);
    }
});

module.exports = pool;

//////////////////////// FIN DE LA PRUEBA ///////////////////////////////////////