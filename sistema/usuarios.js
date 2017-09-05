const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const module = {};

  module.verUsuarios = verUsuarios;

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
                res.json({resultado: true, datos: usuarios})
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
