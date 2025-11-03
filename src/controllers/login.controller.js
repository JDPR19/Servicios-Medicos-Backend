const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); 
const {crearSesion, cerrarSesion, tienesSesionActivo} = require('./sesion.controller');

const loginUsuario = async (req, res, next) => {
    const {username, password} = req.body;
    const ip = req.ip;
    const user_agent = req.headers['user-agent'];

    try {
        const result = await pool.query(`
            SELECT u.*, 
            r.nombre AS roles_nombre, 
            r.permisos
            FROM usuarios u
            INNER JOIN roles r ON u.roles_id = r.id
            WHERE (u.username = $1 OR u.correo = $2) AND estado = TRUE
            `, [username, username]);

            if(result.rows.length === 0){
                return res.status(401).json({
                    message: ' Usuario no Existe'
                });
            }

            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if(!isMatch){
                return res.status(401).json({
                    message: 'usuario o contraseña incorrecto'
                });
            }

            const sesionActiva = await tienesSesionActivo(user.id);
            if(sesionActiva){
                return res.status(403).json({
                    message: 'El Usuario ya Tiene una Sesion Activa en Otro Dispositivo'
                });
            }

            const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                roles_id: user.roles_id,
                permisos: user.permisos
            },
          process.env.JWT_SECRET || 'secret',
          {expiresIn: '3h'}
        );

        await crearSesion(user.id, token, ip, user_agent);

        res.json({
            message: 'Login Exitoso',
            token,
            user: {
                id: user.id,
                username: user.username,
                roles_id: user.roles_id,
                roles_nombre: user.roles_nombre,
                permisos: user.permisos
            
            }
        });
    } catch (error) {
        console.error('Error validando Login:', error);
        res.status(500).json({
            message: 'Ocurrio un error Interno en el Servidor',
            error: error.message
        });
    }
};

const logoutUsuario = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if(token){
            await cerrarSesion(token);
        }

        return res.status(200).json({message: ' Sesión cerrada exitosamente'})
    } catch (error) {
        res.status(500).json({message: 'error cerrando sesión', error: error.message});
    }
};

async function getNotificacionesPendientes(req, res, next) {
    try{
        const  usuario_id = req.query.usuario_id;
        if(!usuario_id){
            return res.status(400).json({error: 'usuario_id es requerido'});
        }

        const result = await pool.query(`SELECT * FROM notificaciones WHERE usuario_id = $1 AND leida = FALSE ORDER BY created_at DESC `, [usuario_id]);

        res.json(result.rows);
        
    }catch(error){
        console.error(error);
        next(error);
    }
};

module.exports = {loginUsuario, logoutUsuario, getNotificacionesPendientes} ;