const { Router } = require('express');
const verificarToken = require('../helpers/verificarToken');
const checkPermisos = require('../helpers/checkPermisos');
const { getAllMedicamentos, createMedicamento, getMedicamento, updateMedicamento, deleteMedicamento, getCategoriaM } = require('../controllers/medicamentos.controller');

const router = Router();

router
    .route('/')
    .get(verificarToken, checkPermisos('medicamentos', 'ver'), getAllMedicamentos);

router
    .route('/registrar')
    .post(verificarToken, checkPermisos('medicamentos', 'crear'), createMedicamento);

router 
    .route('/categorias/')
    .get(verificarToken, checkPermisos('medicamentos', 'ver'), getCategoriaM);
router
    .route('/ver/:id')
    .get(verificarToken, checkPermisos('medicamentos', 'ver'), getMedicamento);

router
    .route('/actualizar/:id')
    .put(verificarToken, checkPermisos('medicamentos', 'editar'), updateMedicamento);

router
    .route('/eliminar/:id')
    .delete(verificarToken, checkPermisos('medicamentos', 'eliminar'), deleteMedicamento);

module.exports = router;