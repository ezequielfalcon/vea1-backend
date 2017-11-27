const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const module = {};

  module.nuevoPrecio = nuevoPrecio;
  module.verPreciosProducto = verPreciosProducto;
  module.productosConPrecios = productosConPrecios;

  function productosConPrecios(req, res) {
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
          if (roles.includes('admin') || roles.includes('stock') || roles.includes('caja')) {
            db.manyOrNone('SELECT productos.id, productos.nombre, productos.codigo, productos.stock_minimo, categorias.nombre categoria ' +
              'FROM productos INNER JOIN categorias ON productos.id_categoria = categorias.id WHERE productos.id_cliente_int = $1;', decoded.cliente)
              .then(productos => {
                const productosStock = [];
                let productosProcesados = 0;
                for (const producto of productos) {
                  const nuevoProdMod = producto;
                  db.oneOrNone('SELECT precio FROM precios_por_producto WHERE id_producto = $1 ' +
                    'AND id_cliente_int = $2 ORDER BY fecha DESC LIMIT 1;', [producto.id, decoded.cliente])
                    .then(precio => {
                      if (precio) {
                        nuevoProdMod.precio = precio.precio;
                      } else {
                        nuevoProdMod.precio = 0;
                      }
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

  function verPreciosProducto(req, res) {
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
            if(req.params.id_producto) {
              db.manyOrNone('SELECT id, id_producto, precio, fecha FROM precios_por_producto ' +
                'WHERE id_producto = $1 AND id_cliente_int = $2 ORDER BY fecha DESC;'
                , [req.params.id_producto, decoded.cliente])
                .then(precios => {
                  res.json({resultado: true, datos: precios})
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

  function nuevoPrecio(req, res) {
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
            if(req.params.id_producto && req.body.precio) {
              db.one('INSERT INTO precios_por_producto (id_producto, precio, fecha, id_cliente_int) ' +
                'VALUES ($1, $2, current_timestamp, $3) RETURNING id;', [req.params.id_producto, req.body.precio, decoded.cliente])
                .then(nuevoPrecio => {
                  res.json({resultado: true, id: nuevoPrecio.id})
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
