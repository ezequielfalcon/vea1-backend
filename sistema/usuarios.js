/**
 * Created by falco on 7/7/2017.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = function (db) {
    let module = {};

    module.nuevoUsuario = nuevoUsuario;
    module.borrarUsuario = borrarUsuario;

    function borrarUsuario(req, res) {
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
                    if (roles.includes('admin')) {
                        if (req.params.nombre) {
                            db.none('DELETE FROM usuarios WHERE nombre = $1;', req.params.nombre)
                                .then(() => {
                                    res.json({resultado:true});
                                })
                                .catch( err => {
                                    console.error(err);
                                    if (err.code === '23503') {
                                        res.status(400).json({resultado: false, mensaje: 'El usuario tiene datos y no se puede borrar!'})
                                    }
                                    else {
                                        res.status(500).json({resultado: false, mensaje: err})
                                    }
                                });
                        }
                        else {
                            res.status(400).json({resultado: false, mensaje: 'Faltan parámetros'})
                        }
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

    function nuevoUsuario(req, res) {
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
                    if (roles.includes('admin')) {
                        if (req.body.nombre && req.body.clave) {
                            const nombre_apellido = req.body.nombre_apellido || '';
                            const email = req.body.email || '';
                            const telefono = req.body.telefono || '';
                            const direccion = req.body.direccion || '';
                            const hash = bcrypt.hashSync(req.body.clave, 10);
                            db.none('INSERT INTO usuarios (nombre, clave, id_cliente_int, nombre_apellido, email, telefono, direccion) ' +
                                'VALUES ($1, $2, $3, $4, $5, $6, $7);'
                                ,[req.body.nombre, hash, decoded.cliente, nombre_apellido, email, telefono, direccion])
                                .then(() => {
                                    res.json({resultado: true})
                                })
                                .catch(err => {
                                    console.error(err);
                                    if (err.code === '23505') {
                                        res.status(400).json({resultado: false, mensaje: 'Ya existe un usuario con ese nombre!'})
                                    }
                                    else {
                                        res.status(500).json({resultado: false, mensaje: err.error})
                                    }
                                })
                        }
                        else {
                            res.status(400).json({resultado: false, mensaje: 'Faltan parámetros!'})
                        }
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