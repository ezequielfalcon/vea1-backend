const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const module = {};

  module.crearMenu = crearMenu;
  module.verMenus = verMenus;

  function verMenus(req, res) {
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
          if (roles.includes('admin') || roles.includes('stock')) {
            db.manyOrNone('SELECT id, nombre FROM menus WHERE id_cliente_int = $1', decoded.cliente)
              .then(menus => {
                res.json({resultado: true, datos: menus})
              })
              .catch( err => {
                console.error(err.detail);
                res.status(500).json({resultado: false, mensaje: err.detail})
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
    } else {
      res.status(401).json({
        resultado: false,
        mensaje: 'No token provided.'
      });
    }
  }

  function crearMenu(req, res) {
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
          if (roles.includes('admin') || roles.includes('stock')) {
            if (req.body.nombre) {
              db.oneOrNone('SELECT id FROM menus WHERE nombre = $1 AND id_cliente_int = $2', [req.body.nombre, decoded.cliente])
                .then(idExiste => {
                  if (idExiste) {
                    res.status(400).json({resultado: false, mensaje: 'Ya existe un menú con ese nombre!'})
                  } else {
                    db.one('INSERT INTO menus (nombre, id_cliente_int) VALUES ($1, $2) RETURNING id;'[req.body.nombre, decoded.cliente])
                      .then(nuevoMenu => {
                        res.json({resultado: true, id: nuevoMenu.id})
                      })
                      .catch( err => {
                        console.error(err.detail);
                        res.status(500).json({resultado: false, mensaje: err.detail})
                      });
                  }
                })
                .catch( err => {
                  console.error(err.detail);
                  res.status(500).json({resultado: false, mensaje: err.detail})
                });
            } else {
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
    } else {
      res.status(401).json({
        resultado: false,
        mensaje: 'No token provided.'
      });
    }
  }

  return module;
};
