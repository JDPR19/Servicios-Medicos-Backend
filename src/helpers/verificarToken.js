const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const verificarToken = async (req, res, next) => {
    try {
        const autenticarHeader = req.headers.authorization;
        console.log('Authorization header:', autenticarHeader);

        if (!autenticarHeader || !autenticarHeader.startsWith('Bearer')) {
            console.log('No se proporcionó el token o formato incorrecto');
            return res.status(401).json({
                message: 'Token no proporcionado'
            });
        }

        // CORRECCIÓN: split(' ')[1] para obtener el token después de 'Bearer'
        const token = autenticarHeader.split(' ')[1];
        console.log('Token recibido:', token);

        // VERIFICAR EL JWT
        let decoded;
        try {
            console.log('JWT_SECRET usado:', process.env.JWT_SECRET);
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            console.log('Token decodificado:', decoded);
        } catch (err) {
            console.log('Error verificando JWT:', err.message);
            return res.status(401).json({
                message: 'Token invalido o Expirado'
            });
        }

        // VERIFICAR LA SESION SI ESTA ACTIVA EN DB
        try {
            const sesion = await pool.query('SELECT * FROM sesiones WHERE token = $1 AND activo = true', [token]);
            console.log('Sesión encontrada en DB:', sesion.rows);

            if (sesion.rows.length === 0) {
                console.log('Sesión no activa o token no encontrado en DB');
                return res.status(404).json({ message: 'Sesión no activa o Token inválido' });
            }
        } catch (dbErr) {
            console.log('Error consultando la base de datos:', dbErr.message);
            return res.status(500).json({ message: 'Error consultando la base de datos', error: dbErr.message });
        }

        req.user = decoded;
        next();

    } catch (error) {
        console.log('Error general en verificarToken:', error.message);
        res.status(500).json({ message: 'Error Verificando Token', error: error.message });
    }
};

module.exports = verificarToken;