/**
 * Created by falco on 4/7/2017.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = function (db) {
    let module = {};

    module.login = login;

    function login(req, res) {
        if (req.body.usuario && req.body.clave && req.body.cliente){
            let user = req.body.usuario;
            db.oneOrNone('SELECT id_cliente_int, clave FROM usuarios WHERE nombre = $1;', user)
                .then(clienteDb => {
                    if (clienteDb) {
                        if (bcrypt.compareSync(clienteDb.id_cliente_int, req.body.cliente)) {
                            if (bcrypt.compareSync(req.body.clave, clienteDb.clave)){
                                console.log("Inicio de sesión de usuario " + user);
                                db.manyOrNone('select roles.nombre ' +
                                    'from roles ' +
                                    'inner join roles_por_usuario on roles.id = roles_por_usuario.id_rol ' +
                                    'INNER JOIN usuarios on roles_por_usuario.usuario = usuarios.nombre ' +
                                    'where usuarios.nombre = $1;', req.body.usuario)
                                    .then(roles => {
                                        if (roles && roles.length > 0) {
                                            let rolesToken = [];
                                            for (let rol of roles) {
                                                rolesToken.push(rol.nombre);
                                            }
                                            const usuarioDb = {
                                                nombre: user,
                                                cliente: req.body.cliente,
                                                roles: JSON.stringify(rolesToken)
                                            };
                                            const token = jwt.sign(usuarioDb, process.env.JWT_SECRET, {expiresIn: "24h"});
                                            res.json({
                                                resultado: true,
                                                mensaje: "Sesión iniciada",
                                                token: token,
                                                usuario: user
                                            })
                                        }
                                        else {
                                            res.status(500).json({resultado: false, mensaje: 'El usuario no tiene roles asignados!'})
                                        }
                                    })
                                    .catch( err => {
                                        console.error(err.detail);
                                        res.status(500).json({resultado: false, mensaje: err.detail})
                                    });
                            }
                            else{
                                console.log("Inicio de sesión no válida por usuario " + user);
                                res.status(401).json({
                                    resultado: false,
                                    mensaje: "Credenciales no válidas"
                                })
                            }
                        }
                        else {
                            console.log("Usuario con hash de cliente invalido: " + user);
                            res.status(401).json({
                                resultado: false,
                                mensaje: "Error de validación"
                            })
                        }
                    }
                    else {
                        console.log("Usuario inexistente intentó inciar sesión: " + user);
                        res.status(400).json({
                            resultado: false,
                            mensaje: "El usuario no existe"
                        })
                    }
            });
        }
        else{
            console.log("error en el POST para login" + req.body);
            res.status(400).json({resultado: false, mensaje: "faltan datos del post: usuario y clave"})
        }
    }

    return module;
};