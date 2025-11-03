const cron = require('node-cron');
const pool = require('./config/db');

// Detecta si hay soporte para notificaciones (solo si existe y no estamos en Render)
let emitir = null;
let puedeEmitir = false;
try {
  if (process.env.RENDER !== 'true') {
    const maybe = require('./helpers/emitirNotificaciones');
    emitir = maybe?.emitEvent || maybe?.emitir || null;
    puedeEmitir = typeof emitir === 'function';
  }
} catch (_) {
  emitir = null;
  puedeEmitir = false;
}

/**
 * Emite eventos de cierre de sesión a clientes conectados (solo si es posible).
 */
const notifyForcedLogout = (sessions) => {
  if (!puedeEmitir || !Array.isArray(sessions) || sessions.length === 0) return;
  const payloadBase = { reason: 'session_expired', redirect: '/' };
  sessions.forEach(s =>
    emitir(`user:${s.usuario_id}`, 'session:expired', { ...payloadBase, session_id: s.id })
  );
};

// Corre cada 5 minutos (ajusta si lo necesitas)
cron.schedule('*/50 * * * *', async () => {
  const started = Date.now();
  try {
    // Marca como inactivas las sesiones vencidas y devuelve las afectadas
    const { rows: expired } = await pool.query(`
      UPDATE public.sesiones
      SET activo = false
      WHERE activo = true
        AND fecha_fin IS NOT NULL
        AND fecha_fin < NOW()
      RETURNING id, usuario_id
    `);

    if (expired.length > 0) {
      console.log(`[${new Date().toISOString()}] Sesiones expiradas: ${expired.length}`);
      // Notificar a clientes solo si es posible (no en Render)
      notifyForcedLogout(expired);
    }
  } catch (err) {
    console.error('Error limpiando sesiones expiradas:', err);
  } finally {
    const took = Date.now() - started;
    if (took > 1000) {
      console.log(`[cleanSessionsJob] Finalizó en ${took} ms`);
    }
  }
});