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

const seguridad = require('./admin/seguridad')(db);
const adminClientes = require('./admin/clientes')(db);

const usuarios = require('./sistema/usuarios')(db);
const productos = require('./sistema/productos')(db);

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

//######################################## API ########################################

//LOGIN
app.post('/login', seguridad.login);


//ADMIN
//clientes
app.get('/admin/clientes', adminClientes.getClientes);
app.post('/admin/clientes', adminClientes.clienteNuevo);
app.put('/admin/clientes/:codigo', adminClientes.modificarCliente);
app.delete('/admin/clientes/:codigo', adminClientes.borrarCliente);


//SISTEMA
//admin
app.post('/usuarios', usuarios.nuevoUsuario);
app.delete('/usuarios/:nombre', usuarios.borrarUsuario);


//productos
app.post('/productos', productos.nuevoProducto);
app.get('/productos', productos.verProductos);
app.put('/productos/:id', productos.modificarProducto);
app.get('/productos-por-id/:id', productos.verProductos);
//categorías
app.post('/productos/categorias', productos.nuevaCategoria);
app.get('/productos/categorias', productos.verCategorias);
app.put('/productos/categorias/:id', productos.modificarCategoria);
app.delete('/productos/categorias/:id', productos.borrarCategoria);
//marcas
app.post('/productos/marcas', productos.nuevaMarca);
app.get('/productos/marcas', productos.verMarcas);
app.put('/productos/marcas/:id', productos.modificarMarca);
app.delete('/productos/marcas/:id', productos.borrarMarca);
//unidades
app.post('/productos/unidades', productos.nuevaUnidad);
app.get('/productos/unidades', productos.verUnidades);
app.put('/productos/unidades/:id', productos.modificarUnidad);
app.delete('/productos/unidades/:id', productos.borrarUnidad);


//#####################################################################################

const reportingApp = express();
app.use('/reportes', reportingApp);

const server = app.listen(app.get('port'), function () {
    console.log('Backend escuchando en puerto ', app.get('port'));
});

const jsreport = require('jsreport')({
    express: {app: reportingApp, server: server},
    appPath: "/reportes",
    connectionString: {
        name: "mongodb",
        uri: process.env.MONGODB_URI
    },
    blobStorage: "gridFS",
    authentication: {
        cookieSession: {
            "secret": "dasd321as56d1sd5s61vdv32"
        },
        admin: {
            "username": "admin",
            "password": process.env.JSREPORT_PASS
        }
    }
});
jsreport.use(require('jsreport-authentication')({}));

jsreport.init().catch(function (e) {
    console.error(e);
});