/**
 * Created by falco on 3/7/2017.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = function (db, pgp) {
    let module = {};
    const qrm = pgp.queryResult;

    module.getUsuarios = getUsuarios;

    function getUsuarios(req, res) {

    }

    return module;
};