const { Router } = require('express');
const verificarToken = require('../helpers/verificarToken');
const checkPermisos = require('../helpers/checkPermisos');
const { getAllFinalidades, createFinalidades, getFinalidades, updateFinalidades, deleteFinalidades } = require('../controllers/finalidades.controller');

const router = Router();

router
    .route('/')
    .get(verificarToken, checkPermisos('finalidades', 'ver'), getAllFinalidades);

router
    .route('/registrar')
    .post(verificarToken, checkPermisos('finalidades', 'crear'), createFinalidades);

router
    .route('/ver/:id')
    .get(verificarToken, checkPermisos('finalidades', 'ver'), getFinalidades);

router
    .route('/actualizar/:id')
    .put(verificarToken, checkPermisos('finalidades', 'editar'), updateFinalidades);

router
    .route('/delete/:id')
    .delete(verificarToken, checkPermisos('finalidades', 'eliminar'), deleteFinalidades);

module.exports = router;
