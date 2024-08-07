const express = require('express');
const router = express.Router();
const bcryptsjs = require('bcryptjs');
const coneccion = require('../DB/db');
const { responseAPI, license, directorio, deldirectorio } = require('../utils/utils');
const authenticateToken = require('../utils/auth');
const dotenv = require('dotenv');
dotenv.config({path:'.env/.env'})

router.use(express.json());
router.use(express.urlencoded({extended: true}));

//Rutas de usuario
router.get('/', (req, res)=>{
    if(req.session.loggedin){
        res.render('inicio',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listapacientes : req.session.pacientes,
            listareportes: req.session.reportes
        });
    }else{
        res.render('login', {msg:'UN MENSAJE DE BIENVENIDA'});
    }
})

router.get('/register', (req, res)=>{
    if(req.session.loggedin){
        res.render('inicio',{
            login: true,
            name: req.session.name
            });
    }else{
        res.render('register');
    }
})
//inicio
router.get('/inicio', authenticateToken, (req, res)=>{
    if(req.session.loggedin){
        res.render('inicio',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listapacientes : req.session.pacientes,
            listareportes: req.session.reportes
        });
    }
})
//ruta lista de pacientes
router.get('/patients', authenticateToken, (req, res)=>{
    if(req.session.loggedin){
        res.render('patients',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listapacientes : req.session.pacientes
        });
    }
})
//filtrado de pacientes
router.post('/filter', authenticateToken, async (req, res)=>{

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
    }
})
//ruta actualizar usuario
router.get('/updateuser', authenticateToken, async (req, res)=>{
    const usuario = await coneccion.usuario(req.session.idD);
    if(req.session.loggedin){
        res.render('updateuser',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            datos: usuario,
            listapacientes : req.session.pacientes
        });
    }
})
//ruta actualizar paciente
router.post('/updatepatients', authenticateToken, async (req, res)=>{
    const paciente = await coneccion.paciente(req.body.idP1);
    if(req.session.loggedin){
        res.render('updatepatients',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            datos: paciente,
            listapacientes : req.session.pacientes
        });
    }
})
//Actualizar usuario
router.post('/updateuserd', authenticateToken, async (req, res)=>{
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
        req.session.user_name = datos.user_name
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
router.post('/updatepatientsd', authenticateToken, async (req, res)=>{
        const datos={
        name : req.body.nameP,
        flastname : req.body.flastnameP,
        slastname : req.body.slastnameP,
        birthdate: req.body.birthdateP || '2000-01-01',
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
//Registro de usuario
router.post('/register', async (req, res)=>{
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
        directorio(req.body.cedula+"")
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
        res.render('register', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Nombre de usuario o cedula ya existen",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 2000,
            ruta: ''
        });
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
router.post('/registropaciente', authenticateToken, async (req, res)=>{
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
    const path = "/"+req.session.cedula+"/"+results[0].id

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
        directorio(path)
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
//Eliminar pacientes
router.post('/eliminarpacientes', authenticateToken, async (req, res)=>{
    console.log(req.body.idP2);
    const results = await coneccion.eliminarp(req.body.idP2);

    if(results){
        req.session.pacientes = await coneccion.pacientes(req.session.idD);
        req.session.reportes = await coneccion.reportes(req.session.idD);
        deldirectorio(req.session.cedula+"/"+req.body.idP2)
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

module.exports = router;