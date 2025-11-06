const { Router } = require('express');
const verificarToken = require('../helpers/verificarToken');
const checkPermisos = require('../helpers/checkPermisos');
const { getAllRoles, createRoles, getRoles, updateRoles, deleteRoles } = require('../controllers/roles.controller');
const router = Router();

router
    .route('/')
    .get(verificarToken, checkPermisos('roles', 'ver'), getAllRoles);

router
    .route('/resgistrar')
    .post(verificarToken, checkPermisos('roles', 'crear'), createRoles);

router
    .route('/ver/:id')
    .get(verificarToken, checkPermisos('roles', 'ver'), getRoles);

router
    .route('/actualizar/:id')
    .put(verificarToken, checkPermisos('roles', 'editar'), updateRoles);

router
    .route('/eliminar/:id')
    .delete(verificarToken, checkPermisos('roles', 'eliminar'), deleteRoles);

module.exports = router;