const pool = require('../config/db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

const solicitarCodigo = async (req, res) => {
    const { email } = req.body;
    try {
        const userResult = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Correo no registrado' });
        }
        const usuario_id = userResult.rows[0].id;
        const code = Math.floor(100000 + Math.random() * 900000).toString(); 
        const expires_at = new Date(Date.now() + 5 * 60 * 1000); 

        await pool.query(
            'INSERT INTO password_reset_codes (usuario_id, code, expires_at) VALUES ($1, $2, $3)',
            [usuario_id, code, expires_at]
        );

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Código de recuperación de contraseña',
            text: `Tu código de recuperación es: ${code}. Expira en 5 minutos.`
        });

        res.json({ message: 'Código enviado al correo' });
    } catch (error) {
        console.error('Error en solicitarCodigo:', error);
        res.status(500).json({ message: 'Error enviando el código', error: error.message });
    }
};


const verificarCodigo = async (req, res) => {
    const { email, code } = req.body;
    try {
        const userResult = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Correo no registrado' });
        }
        const usuario_id = userResult.rows[0].id;
        const codeResult = await pool.query(
            'SELECT * FROM password_reset_codes WHERE usuario_id = $1 AND code = $2 AND usado = FALSE AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1',
            [usuario_id, code]
        );
        if (codeResult.rows.length === 0) {
            return res.status(400).json({ message: 'Código inválido o expirado' });
        }
        res.json({ message: 'Código válido' });
    } catch (error) {
        console.error('Error en verificarCodigo:', error);
        res.status(500).json({ message: 'Error verificando el código' });
    }
};

const cambiarPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
        const userResult = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Correo no registrado' });
        }
        const usuario_id = userResult.rows[0].id;
        const codeResult = await pool.query(
            'SELECT * FROM password_reset_codes WHERE usuario_id = $1 AND code = $2 AND usado = FALSE AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1',
            [usuario_id, code]
        );
        if (codeResult.rows.length === 0) {
            return res.status(400).json({ message: 'Código inválido o expirado' });
        }
        // Hashea la contraseña antes de guardar
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashedPassword, usuario_id]);
        await pool.query('UPDATE password_reset_codes SET usado = TRUE WHERE id = $1', [codeResult.rows[0].id]);
        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error en cambiarPassword:', error);
        res.status(500).json({ message: 'Error cambiando la contraseña' });
    }
};

module.exports = {
    solicitarCodigo,
    verificarCodigo,
    cambiarPassword
};