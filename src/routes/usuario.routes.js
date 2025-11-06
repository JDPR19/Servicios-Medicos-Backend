const { Router } = require('express');
const verificarToken = require('../helpers/verificarToken');
const checkPermisos = require('../helpers/checkPermisos');
const { getAllUsuarios, createUsuario, getUsuario, updateUsuario, deleteUsuario, getCargos, getProfesiones, getRoles, getDoctores } = require('../controllers/usuarios.controller');

const router = Router();

router
    .route('/')
    .get(verificarToken, checkPermisos('usuarios', 'ver'), getAllUsuarios);

router
    .route('/registrar')
    .post(verificarToken, checkPermisos('usuarios', 'crear'), createUsuario);

router
    .route('/catalogos/profesionales')
    .get(verificarToken, checkPermisos('usuarios', 'ver'), getProfesiones);

router
    .route('/catalogos/roles')
    .get(verificarToken, checkPermisos('usuarios', 'ver'), getRoles);


router
    .route('/catalogos/doctores')
    .get(verificarToken, checkPermisos('usuarios', 'ver'), getDoctores);

router
    .route('/catalogos/cargos')
    .get(verificarToken, checkPermisos('usuarios', 'ver'), getCargos);

router
    .route('/ver/:id')
    .get(verificarToken, checkPermisos('usuarios', 'ver'), getUsuario);

router
    .route('/actualizar/:id')
    .put(verificarToken, checkPermisos('usuarios', 'editar'), updateUsuario);

router
    .route('/eliminar/:id')
    .delete(verificarToken, checkPermisos('usuarios', 'eliminar'), deleteUsuario);

module.exports = router;
