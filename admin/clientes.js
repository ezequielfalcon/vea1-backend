/**
 * Created by falco on 3/7/2017.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = function (db, pgp) {
    let module = {};
    const qrm = pgp.queryResult;

    module.getUsuarios = getUsuarios;

    function getUsuarios(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({
                        resultado: false,
                        mensaje: "Error de autenticación"
                    });
                }
                else {
                    let roles = JSON.parse(decoded.roles);
                    if (roles.contains('admin')) {
                        db.manyOrNone('select * from clientes;')
                            .then(clientes => {
                                res.json({resultado: true, datos: clientes})
                            })
                            .catch( err => {
                                console.error(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            });
                    }
                    else {
                        res.status(403).json({
                            resultado: false,
                            mensaje: 'Permiso denegado!'
                        });
                    }
                }
            });
        }
        else{
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    return module;
};