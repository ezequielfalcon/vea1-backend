const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const module = {};

  module.verUsuarios = verUsuarios;
  module.verRoles = verRoles;

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
