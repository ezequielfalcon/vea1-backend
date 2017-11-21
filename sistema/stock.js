const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const module = {};

  // remitos
  

  // stock

  module.verStockProductos = verStockProductos;
  module.nuevoAjuste = nuevoAjuste;
  module.moverStockPorAjuste = moverStockPorAjuste;
  module.verAjustes = verAjustes;
  module.nuevoAjusteUnico = nuevoAjusteUnico;

  function nuevoAjusteUnico(req, res) {
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
            if(req.body.id_producto && req.body.cantidad) {
              const motivo = req.body.motivo || null;
              db.task(t => {
                return t.one('INSERT INTO ajustes_stock (usuario, motivo, fecha, id_cliente_int) ' +
                  'VALUES ($1, $2, current_timestamp, $3) RETURNING id;', [decoded.nombre, motivo, decoded.cliente])
                  .then(nuevoIdAjuste => {
                    return t.one('INSERT INTO stock (id_producto, cantidad, fecha, id_cliente_int) ' +
                      'VALUES ($1, $2, current_timestamp, $3) RETURNING id;', [req.body.id_producto, req.body.cantidad, decoded.cliente])
                      .then(nuevoStockAjuste => {
                        return t.none('INSERT INTO stock_por_ajuste (id_ajuste, id_stock) VALUES ($1, $2);',
                          [nuevoIdAjuste.id, nuevoStockAjuste.id])
                          .then(() => {
                            return nuevoIdAjuste
                          })
                      })
                  })
              })
                .then(idAjuste => {
                  res.json({resultado: true, id: idAjuste.id});
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

  function verAjustes(req, res) {
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
            db.manyOrNone('SELECT id, usuario, motivo, fecha FROM ajustes_stock WHERE id_cliente_int = $1 ORDER BY fecha DESC;', decoded.cliente)
              .then(ajustes => {
                res.json({resultado: true, datos: ajustes})
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

  function moverStockPorAjuste(req, res) {
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
            if (req.params.id && req.body.id_producto && req.body.cantidad) {
              db.task(t => {
                return t.one('INSERT INTO stock (id_producto, cantidad, fecha, id_cliente_int) VALUES ' +
                  '($1, $2, current_timestamp, $3) RETURNING id;', [req.body.id_producto, req.body.cantidad, decoded.cliente])
                  .then(stockId => {
                    return t.none('INSERT INTO stock_por_ajuste (id_ajuste, id_stock) VALUES ($1, $2);', [req.params.id, stockId.id]);
                  })
              })
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

  function nuevoAjuste(req, res) {
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
            const motivo = req.body.motivo || null;
            db.one('INSERT INTO ajustes_stock (usuario, motivo, fecha, id_cliente_int) VALUES ($1, $2, current_timestamp, $3) RETURNING id;'
              , [decoded.nombre, motivo, decoded.cliente])
              .then(idAjuste => {
                res.json({resultado: true, id: idAjuste.id})
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

  function verStockProductos(req, res) {
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
            db.manyOrNone('SELECT productos.id, productos.nombre, productos.codigo, productos.stock_minimo, categorias.nombre categoria ' +
              'FROM productos INNER JOIN categorias ON productos.id_categoria = categorias.id WHERE productos.id_cliente_int = $1;', decoded.cliente)
              .then(productos => {
                const productosStock = [];
                let productosProcesados = 0;
                for (const producto of productos) {
                  const nuevoProdMod = producto;
                  db.one('SELECT COALESCE(SUM(stock.cantidad), 0) cantidad FROM stock WHERE id_producto = $1;', producto.id)
                    .then(cantidad => {
                      nuevoProdMod.cantidad = cantidad.cantidad;
                      productosStock.push(nuevoProdMod);
                      productosProcesados++;
                      if (productosProcesados === productos.length) {
                        res.json({resultado: true, datos: productosStock})
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
