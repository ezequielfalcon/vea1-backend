/**
 * Created by falco on 3/7/2017.
 */
let express = require('express');
let app = express();
let bodyParser = require('body-parser');
const pgp = require("pg-promise")();

const cn = {
    host: 'localhost',
    port: 5432,
    database: 'laesso',
    user: 'falco',
    password: '0h*WR*ms'
};

const db = pgp(process.env.DATABASE_URL || cn);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    res.header("Access-Control-Allow-Methods", "POST, PUT, DELETE, GET, OPTIONS");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('port', (process.env.PORT || 5000));

app.get('/api', function(req, res) {
    res.json({
        mensaje: "Backend del sistema!!"
    })
});

app.listen(app.get('port'), function () {
    console.log('Backend escuchando en puerto ', app.get('port'));
});