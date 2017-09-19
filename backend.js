/**
 * Created by falco on 3/7/2017.
 */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
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

const usuariosAdmin = require('./admin/usuarios')(db);
const productos = require('./sistema/productos')(db);
const proveedores = require('./sistema/proveedores')(db);
const stock = require('./sistema/stock')(db);
const usuarios = require('./sistema/usuarios')(db);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
  res.header("Access-Control-Allow-Methods", "POST, PUT, DELETE, GET, OPTIONS");
  next();
});

const reportingApp = express();
app.use('/reportes', reportingApp);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('port', process.env.PORT || 5000);

app.get('/api', (req, res) => {
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
//usuarios
app.get('/admin/usuarios', usuariosAdmin.verUsuarios);
app.post('/admin/usuarios', usuariosAdmin.nuevoUsuario);
app.delete('/admin/usuarios/:nombre', usuariosAdmin.borrarUsuario);


//SISTEMA

//admin
//usuarios
app.get('/usuarios', usuarios.verUsuarios);
app.get('/usuarios/:nombre', usuarios.verUsuario);
app.post('/usuarios', usuarios.crearUsuario);
app.delete('/usuarios/:nombre', usuarios.borrarUsuario);
app.get('/roles', usuarios.verRoles);


//productos
app.post('/productos', productos.nuevoProducto);
app.post('/producto-rand', productos.nuevoProductoRand);
app.get('/productos', productos.verProductos);
app.get('/productos-full', productos.verProductosFull);
app.put('/productos/:id', productos.modificarProducto);
app.get('/productos-por-id/:id', productos.verProductos);
app.delete('/productos/:id', productos.borrarProducto);
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

//proveedores
app.post('/proveedores', proveedores.nuevoProveedor);
app.get('/proveedores', proveedores.verProveedores);
app.get('/proveedores/:id', proveedores.verProveedores);
app.put('/proveedores/:id', proveedores.modificarProveedor);
app.delete('/proveedores/:id', proveedores.borrarProveedor);

//stock
app.get('/stock/remitos-recibidos', stock.remitosRecibidos);
app.post('/stock/remitos-recibidos', stock.recepcionRemito);

//#####################################################################################


const server = app.listen(app.get('port'), () => {
  console.log('Backend escuchando en puerto ', app.get('port'));
});

const jsreport = require('jsreport')({
  express: { app: reportingApp, server: server },
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

jsreport.init().catch((e) => {
  console.error(e);
});
