const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const module = {};

  module.nuevoPrecio = nuevoPrecio;

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
            if(req.body.id_producto && req.body.precio) {
              db.none('INSERT INTO precios_por_producto (id_producto, precio, fecha, id_cliente_int) ' +
                'VALUES ($1, $2, current_timestamp, $3) RETURNING id;', [req.body.id_producto, req.body.precio, decoded.cliente])
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
