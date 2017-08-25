const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const module = {};

  module.recepcionRemito = recepcionRemito;

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
          if ((roles.includes('caja') || roles.includes('admin'))) {

          }
        }
      })
    }
  }

  return module;
};
