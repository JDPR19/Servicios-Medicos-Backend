const { Router } = require('express');
const verificarToken = require('../helpers/verificarToken');
const checkPermisos = require('../helpers/checkPermisos');
const { deleteDoctor, updateDoctor, getDoctor, getCargos, getProfesion, createDoctor, getAllDoctores } = require('../controllers/doctor.controller');
const { route } = require('./auth.routes');

const router = Router();

router
    .route('/')
    .get(verificarToken, checkPermisos('doctores', 'ver'), getAllDoctores);

router
    .route('/registrar')
    .post(verificarToken, checkPermisos('doctores', 'crear'), createDoctor);


router
    .route('/cargos')
    .get(verificarToken, checkPermisos('doctores', 'ver'), getCargos);
    
router
    .route('/profesiones')
    .get(verificarToken, checkPermisos('doctores', 'ver'), getProfesion);
router
    .route('/ver/:id')
    .get(verificarToken, checkPermisos('doctores', 'ver'), getDoctor);

router
    .route('/actualizar/:id')
    .put(verificarToken, checkPermisos('doctores', 'editar'), updateDoctor);

router
    .route('/eliminar/:id')
    .delete(verificarToken,checkPermisos('doctores', 'eliminar'), deleteDoctor);

module.exports = router;