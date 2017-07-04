/**
 * Created by falco on 4/7/2017.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = function (db, pgp) {
    let module = {};
    const qrm = pgp.queryResult;

    module.login = login;

    function login(req, res) {
        if (req.body.usuario && req.body.clave && req.body.cliente){
            let user = req.body.usuario;
            db.oneOrNone("select clave from usuarios where nombre = $1 and id_cliente_int = $2;", [user, req.body.cliente])
                .then(data => {
                    if (data === null){
                        console.log("Usuario inexistente intentó inciar sesión: " + user);
                        res.status(400).json({
                            resultado: false,
                            mensaje: "El usuario no existe"
                        })
                    }
                    else{
                        let hashDb = data.clave;
                        if (bcrypt.compareSync(req.body.clave, hashDb)){
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
                                            roles: rolesToken
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
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
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
                })
                .catch( err => {
                    console.log(err);
                    res.status(500).json({resultado: false, mensaje: err})
                })
        }
        else{
            console.log("error en el POST para login" + req.body);
            res.status(400).json({resultado: false, mensaje: "faltan datos del post: usuario y clave"})
        }
    }

    return module;
};