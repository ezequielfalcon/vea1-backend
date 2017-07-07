/**
 * Created by falco on 7/7/2017.
 */
const jwt = require('jsonwebtoken');

module.exports = function (db) {
    let module = {};

    module.nuevoProveedor = nuevoProveedor;
    module.modificarProveedor = modificarProveedor;
    module.verProveedores = verProveedores;
    module.borrarProveedor = borrarProveedor;

    function borrarProveedor(req, res) {
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
                        if (req.params.id) {
                            db.none('DELETE FROM proveedores WHERE id = $1 AND id_cliente_int = $2;',
                                [req.params.id, decoded.cliente])
                                .then(() => {
                                    res.json({resultado:true});
                                })
                                .catch( err => {
                                    console.error(err.detail);
                                    if (err.code === '23503') {
                                        res.status(400).json({resultado: false, mensaje: 'El proveedor está en uso!'})
                                    }
                                    else {
                                        res.status(500).json({resultado: false, mensaje: err.detail})
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

    function verProveedores(req, res) {
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
                    if ((roles.includes('stock') || roles.includes('admin'))) {
                        if (req.params.id) {
                            db.oneOrNone('SELECT id, nombre, telefono FROM proveedores WHERE id = $1 AND id_cliente_int = $2;'
                                , [req.params.id, decoded.cliente])
                                .then(proveedor => {
                                    if (proveedor) {
                                        res.json({resultado: true, datos: proveedor})
                                    }
                                    else {
                                        res.status(404).json({resultado: false, mensaje: 'Proveedor no encontrada!'})
                                    }
                                })
                                .catch(err => {
                                    console.error(err.detail);
                                    res.status(500).json({resultado: false, mensaje: err.detail})
                                })
                        }
                        else {
                            db.manyOrNone('SELECT id, nombre, telefono FROM proveedores WHERE id_cliente_int = $1;', decoded.cliente)
                                .then(proveedores => {
                                    res.json({resultado: true, datos: proveedores})
                                })
                                .catch(err => {
                                    console.error(err.detail);
                                    res.status(500).json({resultado: false, mensaje: err.detail})
                                })
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

    function modificarProveedor(req, res) {
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
                    if (roles.includes('admin') || roles.includes('stock')) {
                        if (req.params.id && req.body.nombre) {
                            const telefono = req.body.telefono || null;
                            db.none('UPDATE proveedores SET nombre = $1, telefono = $2 WHERE id = $3 AND id_cliente_int = $4;',
                                [req.body.nombre, telefono, req.params.id, decoded.cliente])
                                .then(() => {
                                    res.json({resultado: true})
                                })
                                .catch( err => {
                                    console.error(err.detail);
                                    res.status(500).json({resultado: false, mensaje: err.detail})
                                })

                        }
                        else {
                            res.status(400).json({resultado: false, mensaje: 'Faltan parámetros'})
                        }
                    }
                    else {
                        res.status(403).json({
                            resultado: false,
                            mensaje: 'Permiso denegado!'
                        })
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

    function nuevoProveedor(req, res) {
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
                    if ((roles.includes('stock') || roles.includes('admin'))) {
                        if (req.body.nombre) {
                            db.one('INSERT INTO proveedores (nombre, id_cliente_int) VALUES ($1, $2) RETURNING id;'
                                , [req.body.nombre, decoded.cliente])
                                .then(nuevoProveedor => {
                                    res.json({resultado: true, id: nuevoProveedor.id})
                                })
                                .catch(err => {
                                    console.error(err.detail);
                                    res.status(500).json({resultado: false, mensaje: err.detail})
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