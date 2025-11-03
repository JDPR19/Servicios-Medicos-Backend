function checkPermiso(pantalla, accion) {
    return (req, res, next) => {
        const permisos = req.user?.permisos;
        if (!permisos || !permisos[pantalla] || !permisos[pantalla][accion]) {
            return res.status(403).json({message: 'No tienes permiso para realizar esta acción'})
        }
        next();
    }
}

module.exports = checkPermiso;