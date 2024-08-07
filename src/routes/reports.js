const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const coneccion = require('../DB/db');
const preproceso = require('../dataprocessing/preprocessing');
const clasifica = require('../classification/classificationconection');
const { fecha, fechaActual, delimagen } = require('../utils/utils');
const authenticateToken = require('../utils/auth');
const dotenv = require('dotenv');
dotenv.config({path:'.env/.env'})

router.use(express.json());
router.use(express.urlencoded({extended: true}));
router.use('../resources', express.static('public'));
router.use('../resources', express.static(__dirname + 'public'));
router.use('../dataprocessing', express.static('dataprocessing'));
router.use('../dataprocessing', express.static(__dirname + 'dataprocessing'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//ruta lista de reportes
router.get('/records', authenticateToken, (req, res)=>{
    if(req.session.loggedin){
        res.render('records',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            listareportes : req.session.reportes
        });
    }
})
//filtrado de reportes
router.post('/filterrecords', authenticateToken, async (req, res)=>{

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
    }
})
//ruta imprimir reporte
router.post('/printreport', authenticateToken, async (req, res)=>{
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
    }
})
//analisis de imagen
router.post('/results', authenticateToken, upload.single('image'), async (req, res) => {
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
            ${data.toString('base64')}`,
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
router.post('/registroreporte', authenticateToken, async (req, res)=>{

    const imageBuffer = Buffer.from(req.session.data.data);
    const fechaactual = fechaActual(); 
    const rutaImagen = '/public/storage/'+req.session.cedula+"/"+req.body.idpaciente+"/"+req.body.idpaciente+'-imagen-'+fechaactual.fechaS+'.png';
    const rim = '.'+rutaImagen;

    fs.writeFile(rim, imageBuffer, (err) => {
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
router.post('/eliminarreporte', authenticateToken, async (req, res)=>{
    console.log(req.body.idP2);
    const reporte = await coneccion.reporte(req.body.idP2, req.session.idD);
    delimagen(reporte[0].image+"")
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

module.exports = router;