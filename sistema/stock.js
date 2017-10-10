const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const module = {};

  module.recepcionRemito = recepcionRemito;
  module.remitosRecibidos = remitosRecibidos;

  function remitosRecibidos(req, res) {
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
          if (roles.includes('caja') || roles.includes('admin')) {
            db.manyOrNone('SELECT remitos.id, remitos.numero, remitos.id_proveedor, remitos.fecha, remitos.observaciones, usuarios.nombre ' +
              'FROM remitos ' +
              'INNER JOIN estado_por_remito ON remitos.id = estado_por_remito.id_remito ' +
              'INNER JOIN usuarios ON estado_por_remito.usuario = usuarios.nombre ' +
              'WHERE estado_por_remito.id_estado = 1 AND remitos.id_cliente_int = $1 ' +
              'ORDER BY remitos.fecha ASC;', decoded.cliente)
              .then(remitosRec => {
                res.json({resultado: true, datos: remitosRec})
              })
              .catch(err => {
                console.error(err);
                res.status(500).json({resultado: false, mensaje: err.detail})
              })
          } else {
            res.status(403).json({
              resultado: false,
              mensaje: 'Permiso denegado!'
            });
          }
        }
      })
    }
  }

  function recepcionRemito(req, res) {
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
          if (roles.includes('caja') || roles.includes('admin')) {
            if (req.body.id_proveedor && req.body.numero) {
              const obs = req.body.observaciones || null;
              db.oneOrNone('SELECT id FROM remitos WHERE id_proveedor = $1 AND numero = $2 AND id_cliente_int = $3;',
                [req.body.id_proveedor, req.body.numero, decoded.cliente])
                .then(remExiste => {
                  console.log(remExiste);
                  if (remExiste) {
                    res.status(400).json({resultado: false, mensaje: 'Ya existe un remito con ese número para ese Proveedor!'})
                  }
                  else {
                    db.one('INSERT INTO remitos (fecha, id_proveedor, id_cliente_int, numero, observaciones) ' +
                      'VALUES (current_timestamp, $1, $2, $3, $4) RETURNING id;',
                    [req.body.id_proveedor, decoded.cliente, req.body.numero, obs])
                      .then(nuevoRemito => {
                        db.none('INSERT INTO estado_por_remito (id_remito, id_estado, fecha) ' +
                          'VALUES ($1, 1, current_timestamp, $2);', [nuevoRemito.id, decoded.nombre])
                          .then(() => {
                            res.json({resultado: true, id: nuevoRemito.id})
                          })
                          .catch(err => {
                            if (err.code === '23503') {
                              res.status(400).json({resultado: false, mensaje: 'El proveedor especificado no existe.'})
                            }
                            else if (err.code === '23505') {
                              res.status(400).json({resultado: false, mensaje: 'El código ya está usado.'})
                            }
                            else {
                              console.error(err);
                              res.status(500).json({resultado: false, mensaje: err.detail})
                            }
                          })
                      })
                      .catch(err => {
                        if (err.code === '23503') {
                          res.status(400).json({resultado: false, mensaje: 'El proveedor especificado no existe.'})
                        }
                        else if (err.code === '23505') {
                          res.status(400).json({resultado: false, mensaje: 'El código ya está usado.'})
                        }
                        else {
                          console.error(err);
                          res.status(500).json({resultado: false, mensaje: err.detail})
                        }
                      })
                  }
                })
                .catch(err => {
                  console.error(err);
                  res.status(500).json({resultado: false, mensaje: err.detail})
                })
            } else {
              res.status(400).json({resultado: false, mensaje: 'Faltan parámetros'})
            }
          } else {
            res.status(403).json({
              resultado: false,
              mensaje: 'Permiso denegado!'
            });
          }
        }
      })
    }
  }

  return module;
};
