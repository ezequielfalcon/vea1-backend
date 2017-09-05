/**
 * Created by falco on 3/7/2017.
 */
const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const module = {};
  const cliente = 'VEA';

  module.getClientes = getClientes;
  module.clienteNuevo = clienteNuevo;
  module.modificarCliente = modificarCliente;
  module.borrarCliente = borrarCliente;

  function borrarCliente(req, res) {
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
          if (roles.includes('admin') && decoded.cliente === cliente) {
            if (req.params.codigo) {
              db.none('DELETE FROM clientes_internos WHERE codigo = $1;', req.params.codigo)
                .then(() => {
                  res.json({resultado:true});
                })
                .catch( err => {
                  console.error(err.detail);
                  if (err.code === '23503') {
                    res.status(400).json({resultado: false, mensaje: 'El cliente tiene datos y no se puede borrar!'})
                  }
                  else {
                    res.status(500).json({resultado: false, mensaje: err.detail})
                  }
                });
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

  function modificarCliente(req, res) {
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
          if (roles.includes('admin') && decoded.cliente === cliente) {
            if (req.params.codigo && req.body.nombre) {
              db.oneOrNone('SELECT codigo from clientes_internos where codigo = $1;', req.params.codigo)
                .then(cliente_int => {
                  if (cliente_int) {
                    db.none('UPDATE clientes_internos SET nombre = $1 WHERE codigo = $2;', [req.body.nombre, req.params.codigo])
                      .then(() => {
                        res.json({resultado: true})
                      })
                      .catch( err => {
                        console.error(err.detail);
                        res.status(500).json({resultado: false, mensaje: err.detail})
                      })
                  }
                  else {
                    res.status(404).json({resultado: false, mensaje: 'Cliente no encontrado!'})
                  }
                })
                .catch( err => {
                  res.status(500).json({resultado: false, mensaje: err})
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
            })
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

  function clienteNuevo(req, res) {
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
          if (roles.includes('admin') && decoded.cliente === cliente) {
            if (req.body.codigo && req.body.nombre) {
              db.none('INSERT INTO clientes_internos (codigo, nombre) VALUES ($1, $2);', [req.body.codigo, req.body.nombre])
                .then(() => {
                  res.json({resultado:true});
                })
                .catch( err => {
                  console.error(err.detail);
                  if (err.code === '23505') {
                    res.status(400).json({resultado: false, mensaje: 'Ya existe un cliente con ese código!'})
                  }
                  else {
                    res.status(500).json({resultado: false, mensaje: err.detail})
                  }
                });
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

  function getClientes(req, res) {
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
          if (roles.includes('admin') && decoded.cliente === cliente) {
            db.manyOrNone('SELECT codigo, nombre FROM clientes_internos;')
              .then(clientes => {
                res.json({resultado: true, datos: clientes})
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
