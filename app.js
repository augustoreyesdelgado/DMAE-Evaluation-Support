const express = require('express');
const app = express();
const multer = require('multer');
const fs = require('fs');
const moment = require('moment');
//captura de datos para el formulario
app.use(express.json());
app.use(express.urlencoded({extended: true}));
//invocar dotenn
const dotenv = require('dotenv');
dotenv.config({path:'.env/.env'})
//directorio publico
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + 'public'));
app.use('/storage', express.static('storage'));
app.use('/storage', express.static(__dirname + 'storage'));
app.use('/dataprocessing', express.static('dataprocessing'));
app.use('/dataprocessing', express.static(__dirname + 'dataprocessing'));
//motor de plantillas
app.set('view engine', 'ejs');
//bcryptsjs
const bcryptsjs = require('bcryptjs');
// variables de sesion
const session = require('express-session');
app.use(session({
    secret:'secret',
    resave: true,
    saveUninitialized: true
}))
//Invocar coneccion a base de datos
const coneccion = require('./DB/db');
//Invocar preprocesamiento
const preproceso = require('./dataprocessing/preprocessing');
//invocar conexion a huggingface
const clasifica = require('./classification/classificationconection');
// Configuración de Multer
const storage = multer.memoryStorage(); // Almacena la imagen en memoria
const upload = multer({ storage: storage });
//Rutas de usuario
app.get('/', (req, res)=>{
    res.render('login', {msg:'UN MENSAJE DE BIENVENIDA'});
})

app.get('/register', (req, res)=>{
    if(req.session.loggedin){
        res.render('inicio',{
            login: true,
            name: req.session.name
            });
    }else{
        res.render('register');
    }
})
//Login
app.post('/auth', async (req, res)=>{
    const user_name = req.body.user;
    const pass= req.body.pass;
    
    if(user_name && pass){
        const results = await coneccion.query(user_name);
        if(results.length == 0 || !(await bcryptsjs.compare(pass, results[0].password))){
            res.render('login',{
            alert: true,
            alertTitle: "Error",
            alertMessage: "Usuario y/o Contraseña Incorrectas",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 1000,
            ruta: ''
            });
        }else{
            req.session.loggedin = true;
            req.session.name = results[0].name+" "+results[0].flastname+" "+results[0].slastname;
            req.session.idD = results[0].id;
            //carga pacientes
            req.session.pacientes = await coneccion.pacientes(req.session.idD);
            req.session.reportes = await coneccion.reportes(req.session.idD);
            res.render('login',{
                alert: true,
                alertTitle: "Acceso Exitoso",
                alertMessage: "Bienvenido Dr. "+req.session.name,
                alertIcon: 'success',
                showConfirmButton: false,
                time: 2000,
                ruta: 'inicio'
            });
        }
    }else{
        res.send('Por favor, ingrese usuario y/o contraseña');
    }

})
//auttentificación de paginas
//inicio
app.get('/inicio', (req, res)=>{
    if(req.session.loggedin){
        res.render('inicio',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listapacientes : req.session.pacientes,
            listareportes: req.session.reportes
        });
    }else{
        res.render('login',{
            alert: true,
            alertTitle: "Error",
            alertMessage: "Debe Iniciar Sesión",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 2000,
            ruta: ''
            });
    }
})
//ruta lista de reportes
app.get('/records', (req, res)=>{
    if(req.session.loggedin){
        res.render('records',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listareportes : req.session.reportes
        });
    }else{
        res.render('login',{
            alert: true,
            alertTitle: "Error",
            alertMessage: "Debe Iniciar Sesión",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 2000,
            ruta: ''
            });
    }
})
//filtrado de reportes
app.post('/filterrecords', async (req, res)=>{

    data = {
        nombre: req.body.nameP1 || '',
        fecha: req.body.dateP1 || '',
        afeccion: req.body.phaseP1 || ''
    }
    const listafiltrada = await coneccion.reportsfiltered(req.session.idD,data);

    if(req.session.loggedin){
        res.render('records',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listareportes : listafiltrada
        });
    }else{
        res.render('login',{
            alert: true,
            alertTitle: "Error",
            alertMessage: "Debe Iniciar Sesión",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 2000,
            ruta: ''
            });
    }
})
//ruta lista de pacientes
app.get('/patients', (req, res)=>{
    if(req.session.loggedin){
        res.render('patients',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listapacientes : req.session.pacientes
        });
    }else{
        res.render('login',{
            alert: true,
            alertTitle: "Error",
            alertMessage: "Debe Iniciar Sesión",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 2000,
            ruta: ''
            });
    }
})
//filtrado de pacientes
app.post('/filter', async (req, res)=>{

    data = {
        nombre: req.body.nameP1 || '',
        fecha: req.body.fecha || '',
        genero: req.body.gender || '',
        estado: req.body.stateP1 || '',
        ciudad: req.body.cityP1 || ''
    }
    const listafiltrada = await coneccion.patientsfiltered(req.session.idD,data);
    if(req.session.loggedin){
        res.render('patients',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listapacientes : listafiltrada
        });
    }else{
        res.render('login',{
            alert: true,
            alertTitle: "Error",
            alertMessage: "Debe Iniciar Sesión",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 2000,
            ruta: ''
            });
    }
})
//ruta actualizar usuario
app.get('/updateuser', async (req, res)=>{
    const usuario = await coneccion.usuario(req.session.idD);
    if(req.session.loggedin){
        res.render('updateuser',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            datos: usuario,
            listapacientes : req.session.pacientes
        });
    }else{
        res.render('login',{
            alert: true,
            alertTitle: "Error",
            alertMessage: "Debe Iniciar Sesión",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 2000,
            ruta: ''
            });
    }
})
//ruta actualizar paciente
app.post('/updatepatients', async (req, res)=>{
    const paciente = await coneccion.paciente(req.body.idP1);
    if(req.session.loggedin){
        res.render('updatepatients',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            datos: paciente,
            listapacientes : req.session.pacientes
        });
    }else{
        res.render('login',{
            alert: true,
            alertTitle: "Error",
            alertMessage: "Debe Iniciar Sesión",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 2000,
            ruta: ''
            });
    }
})
function fecha(fecha, n){
    const analys_date = new Date(fecha);
    const year = analys_date.getFullYear();
    const month = ('0' + (analys_date.getMonth() + 1)).slice(-2); 
    const day = ('0' + analys_date.getDate()).slice(-2);
    const formattedBirthdate = `${year}-${month}-${day}`;
    if(n=='fecha'){
    return formattedBirthdate;
    }else if(n=='edad'){
    const age = moment().diff(formattedBirthdate, 'years');
    console.log(age)
    return age;
    }
}
function fechaActual(){
    const fechaActual = new Date();
    const dia = fechaActual.getDate();
    const mes = fechaActual.getMonth() + 1;
    const año = fechaActual.getFullYear();
    const horas = fechaActual.getHours();
    const minutos = fechaActual.getMinutes();
    const segundos = fechaActual.getSeconds();
    const fechaHoraString = `${año}-${mes}-${dia}-${horas}-${minutos}-${segundos}`;
    const fechaString = `${año}-${mes}-${dia}`;
    const fechas={
        fechaD:fechaActual,
        fechaS:fechaHoraString,
        fechaSm:fechaString
    }
    return fechas;
}
//ruta imprimir reporte
app.post('/printreport', async (req, res)=>{
    const reporte = await coneccion.reporte(req.body.idP1, req.session.idD);
    console.log(reporte[0].name);
    
    a_date = fecha(reporte[0].analys_date,'fecha');
    edad = fecha(reporte[0].birthdate,'edad');
    const fechaString = fechaActual().fechaSm;

    if(req.session.loggedin){
        res.render('printreport',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            datos: reporte[0],
            a_date,
            edad,
            fechaString
        });
    }else{
        res.render('login',{
            alert: true,
            alertTitle: "Error",
            alertMessage: "Debe Iniciar Sesión",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 2000,
            ruta: ''
            });
    }
})
//Actualizar usuario
app.post('/updateuserd', async (req, res)=>{
    const dan = license((await responseAPI(req.body.cedula)).items[0]);
    if(dan.name.toLowerCase() ===req.body.name.toLowerCase() && dan.lastname.toLowerCase()===req.body.flastname.toLowerCase() && 
        dan.lastname2.toLowerCase()==req.body.slastname.toLowerCase() && dan.id==req.body.cedula){
    const datos={
    user_name : req.body.user,
    name : req.body.name,
    flastname : req.body.flastname,
    slastname : req.body.slastname,
    cedula : req.body.cedula,
    birthdate: req.body.birthdate || '2000/01/01', 
    state: req.body.state || "Veracruz", 
    city: req.body.city || "Córdoba",
    type: '0'
    }
    coneccion.updateu(datos, req.session.idD).then(result => {
        res.render('inicio', {
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listapacientes: req.session.pacientes,
            listareportes: req.session.reportes,
            alert: true,
            alertTitle: "Actualización",
            alertMessage: "¡Actualización Exitosa!",
            alertIcon: 'success',
            showConfirmButton: false,
            time: 2000,
            ruta: 'inicio'
        });
    })
    .catch(error => {
        console.log(error);
        // Manejo del error, como enviar una respuesta de error al cliente
    });
}else{
    res.render('inicio', {
        login: true,
        name: req.session.name,
        id: req.session.idD,
        listapacientes: req.session.pacientes,
        listareportes: req.session.reportes,
        alert: true,
        alertTitle: "Error",
        alertMessage: "La cedula no coincide o no exise",
        alertIcon: 'error',
        showConfirmButton: false,
        time: 2000,
        ruta: 'inicio'
    });
}
})

//Actualizar paciente
app.post('/updatepatientsd', async (req, res)=>{
        const datos={
        name : req.body.nameP,
        flastname : req.body.flastnameP,
        slastname : req.body.slastnameP,
        birthdate: req.body.birthdateP || '2000/01/01',
        gender : req.body.gender,
        state: req.body.stateP || "Veracruz", 
        city: req.body.cityP || "Córdoba",
        type: '1',
        idD: req.session.idD
        }
    
        const results = await coneccion.updatep(datos, req.body.idP);
    
        if(results){
            req.session.pacientes = await coneccion.pacientes(req.session.idD);
            req.session.reportes = await coneccion.reportes(req.session.idD);
            res.render('inicio', {
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listapacientes: req.session.pacientes,
            alert: true,
            alertTitle: "Actualización",
            alertMessage: "¡Actualización Exitosa!",
            alertIcon: 'success',
            showConfirmButton: false,
            time: 1500,
            ruta: 'inicio'
            });
        }else{
            res.render('inicio',{
                login: true,
                name: req.session.name,
                id: req.session.idD,
                listapacientes: req.session.pacientes,    
                alert: true,
                alertTitle: "Error",
                alertMessage: "Algo ha salido mal, intentelo de nuevo por favor",
                alertIcon: 'error',
                showConfirmButton: false,
                time: 1500,
                ruta: 'inicio'
                });
        }
})
//logout
app.get('/logout', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/');
    });
})
//Registro de usuario
app.post('/register', async (req, res)=>{
    let passwordHash = await bcryptsjs.hash(req.body.pass, 8);
    const dan = license((await responseAPI(req.body.cedula)).items[0]);
    if(dan.name.toLowerCase() ===req.body.name.toLowerCase() && dan.lastname.toLowerCase()===req.body.flastname.toLowerCase() && 
        dan.lastname2.toLowerCase()==req.body.slastname.toLowerCase() && dan.id==req.body.cedula){
    const datos={
    user_name : req.body.user,
    name : req.body.name,
    flastname : req.body.flastname,
    slastname : req.body.slastname,
    cedula : req.body.cedula,
    pass : passwordHash,
    birthdate: req.body.birthdate || '2000/01/01', 
    state: req.body.state || "Veracruz", 
    city: req.body.city || "Córdoba",
    type: '0'
    }
    coneccion.agregar('usuarios', datos).then(result => {
        res.render('register', {
            alert: true,
            alertTitle: "Registro",
            alertMessage: "¡Registro Exitoso!",
            alertIcon: 'success',
            showConfirmButton: false,
            time: 2000,
            ruta: ''
        });
    })
    .catch(error => {
        console.log(error);
        // Manejo del error, como enviar una respuesta de error al cliente
    });
}else{
    res.render('register', {
        alert: true,
        alertTitle: "Error",
        alertMessage: "La cedula no coincide o no exise",
        alertIcon: 'error',
        showConfirmButton: false,
        time: 2000,
        ruta: ''
    });
}
})
//Registro de paciente
app.post('/registropaciente', async (req, res)=>{
    const datos={
    name : req.body.nameP,
    flastname : req.body.flastnameP,
    slastname : req.body.slastnameP,
    birthdate: req.body.birthdateP || '2000/01/01',
    gender : req.body.gender,
    state: req.body.stateP || "Veracruz", 
    city: req.body.cityP || "Córdoba",
    type: '1',
    idD: req.session.idD
    }

    const results = await coneccion.agregarP(datos);

    if(results.length == 0){
        res.render('inicio',{
        login: true,
        name: req.session.name,
        id: req.session.idD,
        listapacientes: req.session.pacientes,    
        alert: true,
        alertTitle: "Error",
        alertMessage: "Algo ha salido mal, intentelo de nuevo por favor",
        alertIcon: 'error',
        showConfirmButton: false,
        time: 1500,
        ruta: 'inicio'
        });
    }else{
        req.session.pacientes = await coneccion.pacientes(req.session.idD);
        res.render('inicio', {
        login: true,
        name: req.session.name,
        id: req.session.idD,
        listapacientes: req.session.pacientes,
        alert: true,
        alertTitle: "Registro",
        alertMessage: "¡Registro Exitoso!",
        alertIcon: 'success',
        showConfirmButton: false,
        time: 1500,
        ruta: 'inicio'
        });
    }
})
//analisis de imagen
app.post('/results', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            // No se ha subido ningún archivo
            res.render('inicio', {login: true, n, result: { error: "No se ha seleccionado ningún archivo" } });
            return;
        }

        const data = await preproceso.procesarImagen(req.file.buffer); // Obtén el contenido del archivo directamente desde el buffer
        
        req.session.data=data;

        const response = await clasifica.clasifica(data);

        const result = await response.json();
        
        res.render('results', { 
            result, 
            login: true, 
            id_p: req.body.id_p,
            side: req.body.side,
            image: `data:${req.file.mimetype};base64,
            ${req.file.buffer.toString('base64')}`,
         });
    } catch (error) {
        console.error("Error:", error);
        res.render('inicio', { login: true, name: req.session.name,
            id: req.session.idD,
            listapacientes : req.session.pacientes,
            listareportes: req.session.reportes,
            result: { error: "Error inesperado" } });
    }
})
//Registro de reporte
app.post('/registroreporte', async (req, res)=>{

    const imageBuffer = Buffer.from(req.session.data.data);
    const fechaactual = fechaActual(); 
    const rutaImagen = 'storage/'+req.body.idpaciente+'-imagen-'+fechaactual.fechaS+'.png';

    fs.writeFile(rutaImagen, imageBuffer, (err) => {
      if (err) {
        console.error('Error al guardar la imagen:', err);
        return;
      }
      console.log('La imagen se ha guardado correctamente en:', rutaImagen);
    });


    const datos={
    id_p : req.body.idpaciente,
    side : req.body.side || 'derecho',
    phase : req.body.phase || 'avanzada',
    acuracy: req.body.acuracy || '95.5',
    image: rutaImagen || 'abc/abc.png',
    analys_date: fechaactual.fechaD
    }

    const results = await coneccion.insert('reportes',datos);

    if(results.length == 0){
        res.render('inicio',{
        login: true,
        name: req.session.name,
        id: req.session.idD,
        listapacientes: req.session.pacientes,    
        alert: true,
        alertTitle: "Error",
        alertMessage: "Algo ha salido mal, intentelo de nuevo por favor",
        alertIcon: 'error',
        showConfirmButton: false,
        time: 1500,
        ruta: 'inicio'
        });
    }else{
        req.session.pacientes = await coneccion.pacientes(req.session.idD);
        req.session.reportes = await coneccion.reportes(req.session.idD);
        res.render('inicio', {
        login: true,
        name: req.session.name,
        id: req.session.idD,
        listapacientes: req.session.pacientes,
        listareportes: req.session.reportes,
        alert: true,
        alertTitle: "Registro",
        alertMessage: "¡Registro de Reporte Exitoso!",
        alertIcon: 'success',
        showConfirmButton: false,
        time: 1500,
        ruta: 'inicio'
        });
    }
})
//Eliminar reporte
app.post('/eliminarreporte', async (req, res)=>{
    console.log(req.body.idP2);
    const results = await coneccion.eliminar(req.body.idP2);

    if(results){
        req.session.pacientes = await coneccion.pacientes(req.session.idD);
        req.session.reportes = await coneccion.reportes(req.session.idD);
        res.render('records', {
        login: true,
        name: req.session.name,
        id: req.session.idD,
        listapacientes: req.session.pacientes,
        listareportes: req.session.reportes,
        alert: true,
        alertTitle: "Eliminación",
        alertMessage: "¡Registro Borrado!",
        alertIcon: 'success',
        showConfirmButton: false,
        time: 1500,
        ruta: 'records'
        });
    }else{
        res.render('inicio',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listapacientes: req.session.pacientes,    
            alert: true,
            alertTitle: "Error",
            alertMessage: "Algo ha salido mal, intentelo de nuevo por favor",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 1500,
            ruta: 'inicio'
            });
    }
})
//Eliminar pacientes
app.post('/eliminarpacientes', async (req, res)=>{
    console.log('hola');
    console.log(req.body.idP2);
    const results = await coneccion.eliminarp(req.body.idP2);

    if(results){
        req.session.pacientes = await coneccion.pacientes(req.session.idD);
        req.session.reportes = await coneccion.reportes(req.session.idD);
        res.render('patients', {
        login: true,
        name: req.session.name,
        id: req.session.idD,
        listapacientes: req.session.pacientes,
        listareportes: req.session.reportes,
        alert: true,
        alertTitle: "Eliminación",
        alertMessage: "¡Registro Borrado!",
        alertIcon: 'success',
        showConfirmButton: false,
        time: 1500,
        ruta: 'patients'
        });
    }else{
        res.render('inicio',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listapacientes: req.session.pacientes,    
            alert: true,
            alertTitle: "Error",
            alertMessage: "Algo ha salido mal, intentelo de nuevo por favor",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 1500,
            ruta: 'inicio'
            });
    }
})
//Verifica cedula
const responseAPI = async (license) => {
    const query = fetch("https://cedulaprofesional.sep.gob.mx/cedula/buscaCedulaJson.action", {
        credentials: "include",
        headers: {
            "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:99.0) Gecko/20100101 Firefox/99.0",
            "Accept": "*/*",
            "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            "X-Requested-With": "XMLHttpRequest",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Sec-GPC": "1"
        },
        referrer: "https://cedulaprofesional.sep.gob.mx/cedula/presidencia/indexAvanzada.action",
        body: `json=%7B%22maxResult%22%3A%221000%22%2C%22nombre%22%3A%22%22%2C%22paterno%22%3A%22%22%2C%22materno%22%3A%22%22%2C%22idCedula%22%3A%22${license}%22%7D`,
        method: "POST",
        mode: "cors"
    })
    return (await query).json()
}
const license = ({
    anioreg,
    curp,
    desins,
    idCedula,
    materno,
    maternoM,
    nombre,
    nombreM,
    paterno,
    paternoM,
    sexo,
    tipo,
    titulo
} = {}) => ({
    registrationYear: anioreg,
    curp,
    institution: desins,
    id: idCedula,
    lastname2: `${materno}${maternoM ? ' ' + maternoM : ''}`,
    name: `${nombre}${nombreM ? ' ' + nombreM : ''}`,
    lastname: `${paterno}${paternoM ? ' ' + paternoM : ''}`,
    gender: sexo,
    type: tipo,
    title: titulo
})
//Arranca servidor
app.listen(3000, (req, res)=>{
    console.log("Server is running in http://localhost:3000");
})