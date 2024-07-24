const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;

//directorio publico
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + 'public'));
app.use('/storage', express.static('storage'));
app.use('/storage', express.static(__dirname + 'storage'));
app.use('/dataprocessing', express.static('dataprocessing'));
app.use('/dataprocessing', express.static(__dirname + 'dataprocessing'));

// Configura el motor de plantillas
app.set('view engine', 'ejs');
app.set('views', './views');

// Configura el middleware de sesiones
app.use(session({
    secret:'secret',
    resave: true,
    saveUninitialized: true
}))
// Importa las rutas
const indexRoutes = require('./routes/index');
// Importa las rutas
const authRoutes = require('./routes/auth');

// Usa las rutas
app.use('/', indexRoutes);
app.use('/', authRoutes);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
