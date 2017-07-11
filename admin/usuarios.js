/**
 * Created by falco on 7/7/2017.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = function (db) {
    let module = {};

    module.nuevoUsuario = nuevoUsuario;
    module.borrarUsuario = borrarUsuario;
    module.verUsuarios = verUsuarios;

    function verUsuarios(req, res) {
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
                    if (roles.includes('admin') && decoded.cliente === 'VEA') {
                        db.many('SELECT nombre, nombre_apellido, email, telefono, direccion, id_cliente_int FROM usuarios;')
                            .then(usuariosDb => {
                                res.json({resultado: true, datos: usuariosDb})
                            })
                            .catch(err => {
                                console.error(err.detail);
                                res.status(500).json({resultado: false, mensaje: err.detail})
                            })
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
                    if (roles.includes('admin') && decoded.cliente === 'VEA') {
                        if (req.params.nombre) {
                            if (req.params.nombre !== decoded.nombre) {
                                db.none('DELETE FROM usuarios WHERE nombre = $1;', req.params.nombre)
                                    .then(() => {
                                        res.json({resultado:true});
                                    })
                                    .catch( err => {
                                        console.error(err.detail);
                                        if (err.code === '23503') {
                                            res.status(400).json({resultado: false, mensaje: 'El usuario tiene datos y no se puede borrar!'})
                                        }
                                        else {
                                            res.status(500).json({resultado: false, mensaje: err.detail})
                                        }
                                    });
                            }
                            else {
                                res.status(400).json({resultado: false, mensaje: 'No se puede borrar a sí mismo!'})
                            }
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
                    if (roles.includes('admin') && decoded.cliente === 'VEA') {
                        if (req.body.nombre && req.body.clave && req.body.cliente) {
                            const nombre_apellido = req.body.nombre_apellido || '';
                            const email = req.body.email || '';
                            const telefono = req.body.telefono || '';
                            const direccion = req.body.direccion || '';
                            const hash = bcrypt.hashSync(req.body.clave, 10);
                            db.none('INSERT INTO usuarios (nombre, clave, id_cliente_int, nombre_apellido, email, telefono, direccion) ' +
                                'VALUES ($1, $2, $3, $4, $5, $6, $7);'
                                ,[req.body.nombre, hash, req.body.cliente, nombre_apellido, email, telefono, direccion])
                                .then(() => {
                                    db.oneOrNone("SELECT id FROM roles WHERE nombre = 'admin' AND id_cliente_int = $1;", req.body.cliente)
                                        .then(rolAdmin => {
                                            if (rolAdmin) {
                                                db.none('INSERT INTO roles_por_usuario (usuario, id_rol, fecha) VALUES ($1, $2, current_date);'
                                                , [req.body.usuario, rolAdmin.id])
                                                    .then(() => {
                                                        res.json({resultado: true})
                                                    })
                                                    .catch(err => {
                                                        res.status(500).json({resultado: false, mensaje: err.detail})
                                                    })
                                            }
                                            else {
                                                db.one("INSERT INTO roles (nombre, id_cliente_int) VALUES ('admin', $1) RETURNING id;", req.body.cliente)
                                                    .then(rolAdminNuevo => {
                                                        db.none('INSERT INTO roles_por_usuario (usuario, id_rol, fecha) VALUES ($1, $2, current_date);'
                                                            , [req.body.usuario, rolAdminNuevo.id])
                                                            .then(() => {
                                                                res.json({resultado: true})
                                                            })
                                                            .catch(err => {
                                                                res.status(500).json({resultado: false, mensaje: err.detail})
                                                            })
                                                    })
                                                    .catch(err => {
                                                        res.status(500).json({resultado: false, mensaje: err.detail})
                                                    })
                                            }
                                        })
                                        .catch(err => {
                                            res.status(500).json({resultado: false, mensaje: err.detail})
                                        })
                                })
                                .catch(err => {
                                    console.error(err.detail);
                                    if (err.code === '23505') {
                                        res.status(400).json({resultado: false, mensaje: 'Ya existe un usuario con ese nombre!'})
                                    }
                                    else {
                                        res.status(500).json({resultado: false, mensaje: err.detail})
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