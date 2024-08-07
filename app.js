const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
app.use(cookieParser());

require('dotenv').config({path:'./env/.env'});
port = process.env.PORT

//directorio publico
app.use('/resources', express.static('public'));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Configura el motor de plantillas
app.set('view engine', 'ejs');
app.set('views', './src/views');

// sesiones
app.use(session({
    secret:process.env.SECRET_KEY,
    resave: true,
    saveUninitialized: true
}))
// Importar las rutas
const authRoutes = require('./src/routes/auth');
const indexRoutes = require('./src/routes/index');
const reportsRoutes = require('./src/routes/reports');

// Usar las rutas
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', reportsRoutes);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
