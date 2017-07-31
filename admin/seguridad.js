/**
 * Created by falco on 4/7/2017.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = function (db) {
  const module = {};

  module.login = login;

  function login(req, res) {
    if (req.body.usuario && req.body.clave && req.body.cliente){
      const user = req.body.usuario;
      const userString = String(user).toLowerCase();
      db.oneOrNone('SELECT id_cliente_int, clave FROM usuarios WHERE nombre = $1;', userString)
        .then(clienteDb => {
          if (clienteDb) {
            bcrypt.compare(clienteDb.id_cliente_int, req.body.cliente)
              .then(hashCliente => {
                if (hashCliente) {
                  bcrypt.compare(req.body.clave, clienteDb.clave)
                    .then(hashClave => {
                      if (hashClave) {
                        console.log("Inicio de sesión de usuario " + userString);
                        db.manyOrNone('select roles.nombre ' +
                                                    'from roles ' +
                                                    'inner join roles_por_usuario on roles.id = roles_por_usuario.id_rol ' +
                                                    'INNER JOIN usuarios on roles_por_usuario.usuario = usuarios.nombre ' +
                                                    'where usuarios.nombre = $1;', userString)
                          .then(roles => {
                            if (roles && roles.length > 0) {
                              const rolesToken = [];
                              for (const rol of roles) {
                                rolesToken.push(rol.nombre);
                              }
                              const usuarioDb = {
                                nombre: userString,
                                cliente: clienteDb.id_cliente_int,
                                roles: JSON.stringify(rolesToken)
                              };
                              const token = jwt.sign(usuarioDb, process.env.JWT_SECRET, {expiresIn: "24h"});
                              res.json({
                                resultado: true,
                                mensaje: "Sesión iniciada",
                                token: token,
                                usuario: userString,
                                rolesToken
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
                        console.log("Inicio de sesión no válida por usuario " + userString);
                        res.status(401).json({
                          resultado: false,
                          mensaje: "Credenciales no válidas"
                        })
                      }
                    })
                }
                else {
                  console.log("Usuario con hash de cliente invalido: " + userString);
                  res.status(401).json({
                    resultado: false,
                    mensaje: "Error de validación"
                  })
                }

              });
          }
          else {
            console.log("Usuario inexistente intentó inciar sesión: " + userString);
            res.status(400).json({
              resultado: false,
              mensaje: "El usuario no existe"
            })
          }
        });
    }
    else{
      console.error("Error en el POST para login");
      res.status(400).json({resultado: false, mensaje: "Ingrese las credenciales correctamente!"})
    }
  }

  return module;
};
