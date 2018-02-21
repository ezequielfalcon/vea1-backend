const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const module = {};

  module.crearMenu = crearMenu;
  module.verMenus = verMenus;
  module.verIngredientes = verIngredientes;
  module.verMenu = verMenu;
  module.agregarIngredienteMenu = agregarIngredienteMenu;
  module.verIngredientesMenu = verIngredientesMenu;
  module.verAdicionales = verAdicionales;
  module.crearPedido = crearPedido;
  module.verPedido = verPedido;
  module.agregarMenuPedido = agregarMenuPedido;
  module.adicionalMenuPedido = adicionalMenuPedido;

  function adicionalMenuPedido(req, res) {
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
          if (roles.includes('admin') || roles.includes('caja')) {
            if (req.params.id_pedido && req.body.id_menu && req.body.id_producto && req.body.cantidad) {
              db.none('INSERT INTO adicionales_menu_pedido (id_producto, id_menu, id_pedido, cantidad) VALUES ($1, $2, $3, $4);'
                ,[req.body.id_producto, req.body.id_menu, req.params.id_pedido, req.body.cantidad])
                .then(() => {
                  res.json({mensaje: 'Adicional agregado!'})
                })
                .catch(err => {
                  console.error(err);
                  res.status(500).json({resultado: false, mensaje: err})
                })
            } else {
              res.status(400).json({mensaje: 'Falta ID de pedido, de menú o de producto!'})
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

  function agregarMenuPedido(req, res) {
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
          if (roles.includes('admin') || roles.includes('caja')) {
            if (req.params.id && req.body.id_menu, req.body.cantidad) {
              db.none('INSERT INTO menus_por_pedido (id_pedido, id_menu, cantidad) ($1, $2, $3);',
                [req.params.id, req.body.id_menu, req.body.cantidad])
                .then(() => {
                  res.json({mensaje: 'Menú agregado al pedido ' + req.params.id_pedido})
                })
                .catch(err => {
                  console.error(err);
                  res.status(500).json({resultado: false, mensaje: err})
                })
            } else {
              res.status(400).json({mensaje: 'Falta ID de pedido o menú!'})
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

  function verPedido(req, res) {
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
          if (roles.includes('admin') || roles.includes('caja')) {
            if (req.params.id) {
              db.oneOrNone('SELECT fecha, nombre, observacion WHERE id = $1 AND id_cliente_int $2;'
                ,[req.params.id, decoded.cliente])
                .then(pedido => {
                  if (pedido) {
                    res.json({datos: pedido})
                  } else {
                    res.status(404).json({mensaje: 'No se encuentra el pedido!'})
                  }
                })
                .catch(err => {
                  console.error(err);
                  res.status(500).json({resultado: false, mensaje: err})
                })
            } else {
              res.status(400).json({mensaje: 'Falta ID!'})
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

  function crearPedido(req, res) {
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
          if (roles.includes('admin') || roles.includes('caja')) {
            const nombre = req.body.nombre || null;
            const observaciones = req.body.observaciones || null;
            db.one('INSERT INTO pedidos (fecha, id_cliente_int, nombre, observacion) ' +
            'VALUES (current_timestamp, $1, $2, $3) RETURNING id;', [decoded.cliente, nombre, observaciones])
              .then(nuevoPedido => {
                res.json({id: nuevoPedido.id})
              })
              .catch(err => {
                console.error(err);
                res.status(500).json({resultado: false, mensaje: err})
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
    } else {
      res.status(401).json({
        resultado: false,
        mensaje: 'No token provided.'
      });
    }
  }

  function verAdicionales(req, res) {
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
          db.manyOrNone('SELECT p.id id, p.nombre nombre, p.codigo codigo, c.nombre categoria FROM productos p ' +
                          'INNER JOIN categorias c ON p.id_categoria = c.id  ' +
                          'WHERE p.id_cliente_int = $1 and p.es_adicional = true ORDER BY p.id DESC;', decoded.cliente)
            .then(ingredientes => {
              res.json({resultado: true, datos: ingredientes})
            })
            .catch(err => {
              console.error(err);
              res.status(500).json({resultado: false, mensaje: err})
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

  function verIngredientesMenu(req, res) {
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
          if (req.params.id_menu) {
            db.manyOrNone('SELECT productos.id, productos.nombre, productos.codigo, productos_por_menu.cantidad FROM productos_por_menu ' +
                        'INNER JOIN productos ON productos.id = productos_por_menu.id_producto ' +
                        'INNER JOIN menus ON productos_por_menu.id_menu = menus.id  ' +
                        'WHERE menus.id = $1 AND menus.id_cliente_int = $2 ORDER BY productos.id DESC;',
            [req.params.id_menu, decoded.cliente])
              .then(ingredientes => {
                res.json({resultado: true, datos: ingredientes})
              })
              .catch(err => {
                console.error(err);
                res.status(500).json({resultado: false, mensaje: err})
              })
          } else {
            res.status(400).json({resultado: false, mensaje: 'Faltan parámetros'})
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

  function agregarIngredienteMenu(req, res) {
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
          if (req.params.id_menu && req.body.id_producto && req.body.cantidad) {
            db.none('INSERT INTO productos_por_menu (id_menu, id_producto, cantidad) VALUES ($1, $2, $3);'
              ,[req.params.id_menu, req.body.id_producto, req.body.cantidad])
              .then(() => {
                res.json({resultado: true})
              })
              .catch(err => {
                console.error(err);
                res.status(500).json({resultado: false, mensaje: err})
              })
          } else {
            res.status(400).json({resultado: false, mensaje: 'Faltan parámetros'})
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

  function verMenu(req, res) {
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
          if (req.params.id) {
            db.oneOrNone('SELECT id, nombre FROM menus WHERE id = $1 AND id_cliente_int = $2;'
              , [req.params.id, decoded.cliente])
              .then(menu => {
                if (menu) {
                  res.json({datos: menu})
                } else {
                  res.status(404).json({resultado: false, mensaje: 'No se encontró el menú!'})
                }
              })
              .catch(err => {
                console.error(err);
                res.status(500).json({resultado: false, mensaje: err})
              })
          } else {
            res.status(400).json({resultado: false, mensaje: 'Faltan parámetros'})
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

  function verIngredientes(req, res) {
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
          db.manyOrNone('SELECT productos.id id, productos.nombre nombre, productos.codigo codigo, categorias.nombre categoria FROM productos ' +
                        'INNER JOIN categorias ON productos.id_categoria = categorias.id  ' +
                        'WHERE productos.id_cliente_int = $1 and productos.es_ingrediente = true ORDER BY productos.id DESC;', decoded.cliente)
            .then(ingredientes => {
              res.json({resultado: true, datos: ingredientes})
            })
            .catch(err => {
              console.error(err);
              res.status(500).json({resultado: false, mensaje: err})
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
                console.error(err);
                res.status(500).json({resultado: false, mensaje: err})
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
              db.oneOrNone('SELECT id FROM menus WHERE nombre = $1 AND id_cliente_int = $2;', [req.body.nombre, decoded.cliente])
                .then(idExiste => {
                  if (idExiste) {
                    res.status(400).json({resultado: false, mensaje: 'Ya existe un menú con ese nombre!'})
                  } else {
                    db.one('INSERT INTO menus (nombre, id_cliente_int) VALUES ($1, $2) RETURNING id;', [req.body.nombre, decoded.cliente])
                      .then(nuevoMenu => {
                        res.json({resultado: true, id: nuevoMenu.id})
                      })
                      .catch( err => {
                        console.error(err);
                        res.status(500).json({resultado: false, mensaje: err})
                      });
                  }
                })
                .catch( err => {
                  console.error(err);
                  res.status(500).json({resultado: false, mensaje: err})
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
