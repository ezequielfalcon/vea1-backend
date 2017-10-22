const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const module = {};

  module.recepcionRemito = recepcionRemito;
  module.remitosRecibidos = remitosRecibidos;
  module.verRemitoParaCarga = verRemitoParaCarga;
  module.verProductosPorRemito = verProductosPorRemito;
  module.confirmarRemito = confirmarRemito;
  module.agregarProductoRemito = agregarProductoRemito;
  module.remitosEnCarga = remitosEnCarga;
  module.historialRemitos = historialRemitos;
  module.quitarProductoRemito = quitarProductoRemito;

  function quitarProductoRemito(req, res) {
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
          if (roles.includes('stock') || roles.includes('admin')) {
            if (req.params.id_remito  && req.params.id_producto) {
              db.none('DELETE FROM productos_por_remito WHERE id_remito = $1 AND id_producto = $2;',
                [req.params.id_remito, req.params.id_producto])
                .then(() => {
                  res.json({resultado: true});
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

  function historialRemitos(req, res) {
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
          if (roles.includes('stock') || roles.includes('admin')) {
            if (req.params.id) {
              db.manyOrNone('SELECT estado_por_remito.fecha, estados_remito.nombre, estado_por_remito.usuario ' +
                'FROM estado_por_remito INNER JOIN  estados_remito ON estado_por_remito.id_estado = estados_remito.id ' +
                'WHERE estado_por_remito.id_remito = $1;', req.params.id)
                .then(histRemitos => {
                  res.json({resultado: true, datos: histRemitos})
                })
                .catch(err => {
                  console.error(err);
                  res.status(500).json({resultado: false, mensaje: err.detail})
                })
            } else {
              res.status(400).json({resultado: false, mensaje: 'Faltan parámetros!'})
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

  function remitosEnCarga(req, res) {
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
          if (roles.includes('stock') || roles.includes('admin')) {
            db.manyOrNone('SELECT remitos.id, remitos.numero, remitos.id_proveedor, remitos.fecha, remitos.observaciones, usuarios.nombre ' +
              'FROM remitos ' +
              'INNER JOIN estado_por_remito ON remitos.id = estado_por_remito.id_remito ' +
              'INNER JOIN usuarios ON estado_por_remito.usuario = usuarios.nombre ' +
              'WHERE estado_por_remito.id_estado = 2 AND remitos.id_cliente_int = $1 ' +
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

  function agregarProductoRemito(req, res) {
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
          if (roles.includes('stock') || roles.includes('admin')) {
            if (req.body.id_remito  && req.body.id_producto && req.body.cantidad && req.body.costo) {
              const vencimiento = req.body.fecha_vencimiento || null;
              db.none('INSERT INTO productos_por_remito (id_remito, id_producto, cantidad, costo, fecha_vencimiento) ' +
                'VALUES ($1, $2, $3, $4, $5);', [req.body.id_remito, req.body.id_producto, req.body.cantidad,
                req.body.costo, vencimiento])
                .then(() => {
                  res.json({resultado: true})
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

  function confirmarRemito(req, res) {
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
          if (roles.includes('stock') || roles.includes('admin')) {
            if (req.body.id_remito) {
              db.oneOrNone('SELECT id_estado FROM estado_por_remito WHERE id_remito = $1 ORDER BY fecha DESC LIMIT 1;', req.params.id)
                .then(estadoRemito => {
                  if (estadoRemito) {
                    if (estadoRemito.id_estado === '1') {
                      db.none('insert into estado_por_remito (id_remito, id_estado, fecha, usuario) VALUES ($1, 2, current_timestamp, $2);'
                        ,[req.body.id_remito, decoded.nombre])
                        .then(() => {
                          res.json({resultado: true})
                        })
                        .catch(err => {
                          console.error(err);
                          res.status(500).json({resultado: false, mensaje: err.detail})
                        })
                    } else if (estadoRemito.id_estado === '3') {
                      res.status(400).json({resultado: false, mensaje: "No se puede editar un remito finalizado"})
                    } else {
                      res.json({resultado: true, mensaje: "Ya es editable"})
                    }
                  } else {
                    res.status(404).json({resultado: false, mensaje: "No existe un remito con ese ID"})
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

  function verProductosPorRemito(req, res) {
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
          if (roles.includes('stock') || roles.includes('admin')) {
            if (req.params.id_remito) {
              db.manyOrNone('SELECT id_producto, cantidad, costo, fecha_vencimiento FROM productos_por_remito WHERE id_remito = $1;',
                req.params.id_remito)
                .then(productos => {
                  res.json({resultado: true, datos: productos})
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

  function verRemitoParaCarga(req, res) {
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
          if (roles.includes('stock') || roles.includes('admin')) {
            if (req.params.id) {
              db.oneOrNone('SELECT id_estado FROM estado_por_remito WHERE id_remito = $1 ORDER BY fecha DESC LIMIT 1;', req.params.id)
                .then(estadoRemito => {
                  if (estadoRemito) {
                    if (estadoRemito.id_estado == 1 || estadoRemito.id_estado == 2) {
                      db.one('SELECT id, numero, id_proveedor, fecha, observaciones FROM remitos WHERE id = $1 AND id_cliente_int = $2;',
                        [req.params.id, decoded.cliente])
                        .then(remitoPiola => {
                          res.json({resultado: true, datos: remitoPiola});
                        })
                        .catch(err => {
                          console.error(err);
                          res.status(500).json({resultado: false, mensaje: err.detail})
                        })
                    } else {
                      res.status(400).json({resultado: false, mensaje: "El remito está finalizado o anulado!"})
                    }
                  } else {
                    res.status(404).json({resultado: false, mensaje: "No existe un remito con ese ID"})
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
                        db.none('INSERT INTO estado_por_remito (id_remito, id_estado, fecha, usuario) ' +
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
