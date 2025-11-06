const express = require('express');
const morgan = require('morgan');
// const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('./cleanSesion');

/////// INICIO RUTASS///////
const cargos = require('./routes/cargo.routes');
const profesion = require('./routes/profesion.routes');
const estado = require('./routes/estado.routes');
const categoria_e = require('./routes/categoria_e.routes');
const categoria_m = require('./routes/categoria_m.routes');
const finalidades = require('./routes/finalidades.routes');
const roles = require('./routes/roles.routes');
const departamentos = require('./routes/departamentos.routes');
const municipios = require('./routes/municipio.routes');
const parroquias = require('./routes/parroquias.routes');
const sectores = require('./routes/sector.routes');
const pacientes = require('./routes/pacientes.routes');
const doctores = require('./routes/doctor.routes');
const bitacora = require('./routes/bitacora.routes');
const enfermedades = require('./routes/enfermedades.routes');
const usuario = require('./routes/usuario.routes');
const medicamentos = require('./routes/medicamentos.routes');
const historiasMedicas = require('./routes/historias_medicas.routes');
const signos = require('./routes/signos_vitales.routes');
const reposos = require('./routes/reposos.routes');
const seguimientos = require('./routes/seguimiento.routes');
const consultas = require('./routes/consulta.routes');
const login = require('./routes/auth.routes');
const recuperacion = require('./routes/recuperacion.routes');
// ///////// FIN RUTAS ///////


// --- Configuración de CORS ---
const allowed = [
    'http://localhost:5173','https://servicios-medicos-puce.vercel.app',
];
const corsOptions = {
    origin: allowed,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
};
// INICIANDO EXPRESS////

const app = express();
app.use(express.json());

///// MIDDLEWARES////////

app.use(cors(corsOptions));
app.use(morgan('dev'));

////////////////////////// 

// -----Socket.io ------
const server = http.createServer(app);
    const io = new Server(server, {
    cors: {
        origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowed.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS WS no permitido: ${origin}`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    },
    transports: ['websocket', 'polling'],
    path: '/socket.io'
});

// ---Guardar el objeto io para usarlo en los controladores-----
global.io = io;
app.set('io', io);

io.on('connection', (socket) => {
    console.log('socket conectado:', socket.id);

    socket.on('join', (usuarioId) => {
        socket.join(`user:${usuarioId}`);
    });

    socket.on('disconnect', (reason) => {
        console.warn('socket desconectado:', reason);
    });

    socket.on('error', (err) => {
        console.error('socket error:', err?.message || err);
    });
});
// -------------------////////////////////

///////////// USO DE RUTAS ////////////////
app.use('/recuperacion', recuperacion);
app.use('/auth', login);
app.use('/consultas', consultas);
app.use('/seguimientos', seguimientos);
app.use('/reposos', reposos);
app.use('/signos_vitales', signos);
app.use('/historias_medicas', historiasMedicas);
app.use('/medicamentos', medicamentos);
app.use('/usuarios', usuario);
app.use('/enfermedades', enfermedades);
app.use('/bitacora', bitacora);
app.use('/doctores', doctores);
app.use('/pacientes', pacientes);
app.use('/sectores', sectores);
app.use('/parroquias', parroquias);
app.use('/municipios', municipios);
app.use('/departamentos', departamentos);
app.use('/roles', roles);
app.use('/finalidad', finalidades);
app.use('/categoria_e', categoria_e);
app.use('/categoria_m', categoria_m);
app.use('/estado', estado);
app.use('/cargos', cargos);
app.use('/profesion', profesion);
// FIN DEL USO DE RUTAS ///////////////////

// ----Manejador de Errores Globales/////////
app.use((req, res, next) => {
    res.status(404).json({
        message: 'ruta no encontrada',
    });
});

app.use((err, req, res, next) => {
    console.error('Error Capturado:', err.stack);
    res.status(err.status || 500).json({
        message: 'Ocurrió un error interno en el servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
    });
});
/////////////////////////--------------------------//////////////////////////

/////////// LISTAR EN PUERTO DEL SERVIDOR PARA SU INICIO ////////////////

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto: ${PORT} + socket.io`);
});

