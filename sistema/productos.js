/**
 * Created by falco on 7/7/2017.
 */
const jwt = require('jsonwebtoken');

module.exports = function (db) {
    let module = {};

    module.nuevoProducto = nuevoProducto;
    module.verProductos = verProductos;
    module.nuevaCategoria = nuevaCategoria;
    module.verCategorias = verCategorias;
    module.borrarCategoria = borrarCategoria;
    module.modificarCategoria = modificarCategoria;

    function modificarCategoria(req, res) {
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
                        if (req.params.id && req.body.nombre) {
                            db.none('UPDATE categorias SET nombre = $1 WHERE id = $2 AND id_cliente_int = $3;',
                                [req.body.nombre, req.params.id, decoded.cliente])
                                .then(() => {

                                })
                                .catch( err => {
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

    function borrarCategoria(req, res) {
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
                            db.none('DELETE FROM categorias WHERE id = $1 AND id_cliente_int = $2;',
                                [req.params.id, decoded.cliente])
                                .then(() => {
                                    res.json({resultado:true});
                                })
                                .catch( err => {
                                    console.error(err.detail);
                                    if (err.code === '23503') {
                                        res.status(400).json({resultado: false, mensaje: 'La categoría está en uso!'})
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

    function verCategorias(req, res) {
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
                            db.oneOrNone('SELECT * FROM categorias WHERE id = $1 AND id_cliente_int = $2;'
                                , [req.params.id, decoded.cliente])
                                .then(categoria => {
                                    if (categoria) {
                                        res.json({resultado: true, datos: categoria})
                                    }
                                    else {
                                        res.status(404).json({resultado: false, mensaje: 'Categoría no encontrada!'})
                                    }
                                })
                                .catch(err => {
                                    console.error(err.detail);
                                    res.status(500).json({resultado: false, mensaje: err.detail})
                                })
                        }
                        else {
                            db.manyOrNone('SELECT * FROM categorias WHERE id_cliente_int = $2;', decoded.cliente)
                                .then(categorias => {
                                    res.json({resultado: true, datos: categorias})
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

    function nuevaCategoria(req, res) {
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
                            db.one('INSERT INTO categorias (nombre, id_cliente_int) VALUES ($1, $2) RETURNING id;'
                                , [req.body.nombre, decoded.cliente])
                                .then(nuevaCat => {
                                    res.json({resultado: true, id: nuevaCat.id})
                                })
                                .catch(err => {
                                    console.error(err.detail);
                                    if (err.code === '23505') {
                                        res.status(400).json({resultado: false, mensaje: 'Ya hay una categoría con ese nombre.'})
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

    function verProductos(req, res) {
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
                    if (req.params.id) {
                        db.oneOrNone('SELECT * FROM productos WHERE id = $1 AND id_cliente_int = $2;', [req.params.id, decoded.cliente])
                            .then(producto => {
                                if (producto) {
                                    res.json({resultado: true, datos: producto})
                                }
                                else {
                                    res.status(404).json({resultado: false, mensaje: 'No se encontró el producto.'})
                                }
                            })
                            .catch(err => {
                                console.error(err);
                                res.status(500).json({resultado: false, mensaje: err.detail})
                            })
                    }
                    else {
                        db.manyOrNone('SELECT * FROM productos WHERE id_cliente_int = $1 ORDER BY id DESC LIMIT 50;', decoded.cliente)
                            .then(productos => {
                                res.json({resultado: true, datos: productos})
                            })
                            .catch(err => {
                                console.error(err);
                                res.status(500).json({resultado: false, mensaje: err.detail})
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

    function nuevoProducto(req, res) {
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
                        if (req.body.nombre && req.body.stock_minimo && req.body.codigo
                            && req.body.iva && req.body.id_categoria && req.body.id_marca && req.body.id_unidad) {
                            db.one('INSERT INTO productos (nombre, stock_minimo, iva, codigo, id_categoria, id_unidad, id_cliente_int, id_marca) ' +
                                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;'
                            ,[req.body.nombre, req.body.stock_minimo, req.body.iva, req.body.codigo,
                                    req.body.id_categoria, req.body.id_unidad, decoded.cliente, req.body.id_marca])
                                .then(nuevoP => {
                                    res.json({resultado: true, id: nuevoP.id})
                                })
                                .catch(err => {
                                    console.error(err.detail);
                                    if (err.code === '23503') {
                                        res.status(400).json({resultado: false, mensaje: 'La categoría, marca o unidad especificados no existen.'})
                                    }
                                    else if (err.code === '23505') {
                                        res.status(400).json({resultado: false, mensaje: 'El código ya está usado.'})
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