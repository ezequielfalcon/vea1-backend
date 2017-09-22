const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = function (db) {
  const module = {};

  module.verUsuarios = verUsuarios;
  module.verRoles = verRoles;
  module.crearUsuario = crearUsuario;
  module.borrarUsuario = borrarUsuario;
  module.verUsuario = verUsuario;
  module.modUsuario = modUsuario;

  function modUsuario(req, res) {
    const token = req.headers['x-access-token'];
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.log("Error de autenticación, token inválido!\n" + err);
          res.status(401).json({
            resultado: false,
            mensaje: "Error de autenticación"
          });
        }
        else {
          const roles = JSON.parse(decoded.roles);
          if (roles.includes('admin')) {
            if (req.params.nombre && req.body.id_rol && req.body.nombre_apellido) {
              const email = req.body.email || null;
              const telefono = req.body.telefono || null;
              const direccion = req.body.direccion || null;
              db.none('delete from roles_por_usuario where usuario = $1;', req.params.nombre)
                .then(() => {
                  db.none('insert into roles_por_usuario (usuario, id_rol, fecha) VALUES ($1, $2, current_timestamp);',
                    [req.params.nombre, req.body.id_rol])
                    .then(() => {
                      if (req.body.clave) {
                        const hash = bcrypt.hashSync(req.body.clave, 10);
                        db.none('update usuarios set nombre_apellido = $1, email = $2, telefono = $3, direccion = $4 ' +
                          ', clave = $5 where nombre = $6;', [req.body.nombre_apellido, email, telefono, direccion, hash, req.params.nombre])
                          .then(() => {
                            res.json({resultado: true})
                          })
                          .catch(err => {
                            console.error(err);
                            res.status(500).json({resultado: false, mensaje: err.detail})
                          })
                      }
                      else {
                        db.none('update usuarios set nombre_apellido = $1, email = $2, telefono = $3, direccion = $4 ' +
                          'where nombre = $5;', [req.body.nombre_apellido, email, telefono, direccion, req.params.nombre])
                          .then(() => {
                            res.json({resultado: true})
                          })
                          .catch(err => {
                            console.error(err);
                            res.status(500).json({resultado: false, mensaje: err.detail})
                          })
                      }
                    })
                    .catch(err => {
                      if (err.code === '23503') {
                        res.status(500).json({resultado: false, mensaje: 'El rol especificado no existe!'})
                      } else {
                        console.error(err);
                        res.status(500).json({resultado: false, mensaje: err.detail})
                      }
                    })
                })
                .catch(err => {
                  console.error(err);
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

  function verUsuario(req, res) {
    const token = req.headers['x-access-token'];
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.log("Error de autenticación, token inválido!\n" + err);
          res.status(401).json({
            resultado: false,
            mensaje: "Error de autenticación"
          });
        }
        else {
          const roles = JSON.parse(decoded.roles);
          if (roles.includes('admin')) {
            if (req.params.nombre) {
              db.oneOrNone('select usuarios.nombre, usuarios.nombre_apellido, usuarios.email, usuarios.telefono, ' +
                'usuarios.direccion, roles_por_usuario.id_rol from usuarios ' +
                'inner join roles_por_usuario on usuarios.nombre = roles_por_usuario.usuario ' +
                'where usuarios.nombre = $1 and usuarios.id_cliente_int = $2 ' +
                'GROUP BY  usuarios.nombre, roles_por_usuario.id_rol LIMIT 1;', [req.params.nombre, decoded.cliente])
                .then(usuario => {
                  if(usuario) {
                    res.json({resultado: true, datos: usuario})
                  }
                  else {
                    res.status(404).json({resultado: false, mensaje: 'No se encontró al usuario ' + req.params.nombre})
                  }
                })
                .catch(err => {
                  console.error(err);
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
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.log("Error de autenticación, token inválido!\n" + err);
          res.status(401).json({
            resultado: false,
            mensaje: "Error de autenticación"
          });
        }
        else {
          const roles = JSON.parse(decoded.roles);
          if (roles.includes('admin')) {
            if (req.params.nombre) {
              if (req.params.nombre !== decoded.nombre) {
                db.none('delete from roles_por_usuario where usuario = $1;', req.params.nombre).then(() => {
                  db.none('delete from usuarios where nombre = $1 AND id_cliente_int = $2;',
                    [req.params.nombre, decoded.cliente])
                    .then(() => {
                      res.json({resultado: true})
                    })
                    .catch(err => {
                      if (err.code === '23503') {
                        res.status(400).json({resultado: false, mensaje: 'Error de relaciones.'})
                      }
                      else if (err.code === '23505') {
                        res.status(400).json({resultado: false, mensaje: 'No puede borrar un usuario con datos asociados!'})
                      }
                      else {
                        console.error(err);
                        res.status(500).json({resultado: false, mensaje: err.detail})
                      }
                    })
                })
                  .catch(err => {
                    console.error(err);
                    res.status(500).json({resultado: false, mensaje: err.detail})
                  })
              }
              else {
                res.status(400).json({resultado: false, mensaje: 'No puede borrarse a si mismo!'})
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

  function crearUsuario(req, res) {
    const token = req.headers['x-access-token'];
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.log("Error de autenticación, token inválido!\n" + err);
          res.status(401).json({
            resultado: false,
            mensaje: "Error de autenticación"
          });
        }
        else {
          const roles = JSON.parse(decoded.roles);
          if (roles.includes('admin')) {
            if (req.body.nombre && req.body.clave && req.body.id_rol) {
              const nomre_apellido = req.body.nombre_apellido || null;
              const email = req.body.email || null;
              const telefono = req.body.telefono || null;
              const direccion = req.body.direccion || null;
              const hash = bcrypt.hashSync(req.body.clave, 10);
              db.none('insert into usuarios (nombre, clave, id_cliente_int, nombre_apellido, email, telefono, direccion) ' +
                'VALUES ($1, $2, $3, $4, $5, $6, $7);', [req.body.nombre, hash, decoded.cliente, nomre_apellido, email, telefono, direccion])
                .then(() => {
                  db.none('insert into roles_por_usuario (usuario, id_rol, fecha) VALUES ($1, $2, current_timestamp);',
                    [req.body.nombre, req.body.id_rol])
                    .then(() => {
                      res.json({resultado: true})
                    })
                    .catch(err => {
                      if (err.code === '23503') {
                        res.status(500).json({resultado: false, mensaje: 'El rol especificado no existe!'})
                      } else {
                        console.error(err);
                        res.status(500).json({resultado: false, mensaje: err.detail})
                      }
                    })
                })
                .catch(err => {
                  if (err.code === '23505') {
                    res.status(400).json({resultado: false, mensaje: 'Ese nombre de usuario ya existe!'})
                  } else if (err.code === '23503') {
                    console.error('error de autenticación de cliente en nuevo usuario!!!!');
                    res.status(500).json({resultado: false, mensaje: err.detail})
                  } else {
                    console.error(err);
                    res.status(500).json({resultado: false, mensaje: err.detail})
                  }
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

  function verRoles(req, res) {
    const token = req.headers['x-access-token'];
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err) => {
        if (err) {
          console.log("Error de autenticación, token inválido!\n" + err);
          res.status(401).json({
            resultado: false,
            mensaje: "Error de autenticación"
          });
        }
        else {
          db.manyOrNone('select id, nombre from roles;')
            .then(rolesDb => {
              res.json({resultado: true, datos: rolesDb})
            })
            .catch(err => {
              console.error(err);
              res.status(500).json({resultado: false, mensaje: err.detail})
            })
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

  function verUsuarios(req, res) {
    const token = req.headers['x-access-token'];
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.log("Error de autenticación, token inválido!\n" + err);
          res.status(401).json({
            resultado: false,
            mensaje: "Error de autenticación"
          });
        }
        else {
          const roles = JSON.parse(decoded.roles);
          if (roles.includes('admin')) {
            db.manyOrNone('select nombre, nombre_apellido, email, telefono, direccion ' +
              'from usuarios where id_cliente_int = $1;', decoded.cliente)
              .then(usuarios => {
                let usuariosListos = 0;
                const usuariosConRoles = [];
                for (const usuario of usuarios) {
                  const usuarioNuevo = {};
                  usuarioNuevo.nombre = usuario.nombre;
                  usuarioNuevo.nombre_apellido = usuario.nombre_apellido;
                  usuarioNuevo.email = usuario.email;
                  usuarioNuevo.telefono = usuario.telefono;
                  usuarioNuevo.direccion = usuario.direccion;
                  usuarioNuevo.roles = [];
                  db.manyOrNone('select roles.id, roles.nombre ' +
                    'from roles inner join roles_por_usuario ON roles.id = roles_por_usuario.id_rol ' +
                    'INNER JOIN usuarios on roles_por_usuario.usuario = usuarios.nombre ' +
                    'where roles_por_usuario.usuario = $1 and usuarios.id_cliente_int = $2 ;', [usuario.nombre, decoded.cliente])
                    .then(rolesUsuario => {
                      for (const rolDb of rolesUsuario) {
                        usuarioNuevo.roles.push(rolDb);
                      }
                      usuariosListos++;
                      usuariosConRoles.push(usuarioNuevo);
                      if (usuariosListos === usuarios.length) {
                        res.json({resultado: true, datos: usuariosConRoles})
                      }
                    })
                    .catch(err => {
                      console.error(err);
                      res.status(500).json({resultado: false, mensaje: err.detail})
                    })
                }
              })
              .catch(err => {
                console.error(err);
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

  return module;
};
