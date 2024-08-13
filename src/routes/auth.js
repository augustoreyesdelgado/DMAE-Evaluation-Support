const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcryptsjs = require('bcryptjs');
const coneccion = require('../DB/db');
const authenticateToken = require('../utils/auth');
const dotenv = require('dotenv');
dotenv.config({path:'.env/.env'})

router.use(express.json());
router.use(express.urlencoded({extended: true}));
router.use('../resources', express.static('public'));
router.use('../resources', express.static(__dirname + 'public'));



//Login
router.post('/auth', async (req, res)=>{
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
            req.session.user_name = results[0].user_name
            req.session.cedula = results[0].cedula
            //carga pacientes
            req.session.pacientes = await coneccion.pacientes(req.session.idD);
            req.session.reportes = await coneccion.reportes(req.session.idD);

            const token = jwt.sign({ id: results[0].id }, process.env.SECRET_KEY, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true });

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

//ruta Update password
router.get('/updatepassword', authenticateToken, async (req, res)=>{
    const usuario = await coneccion.usuario(req.session.idD);
    if(req.session.loggedin){
        res.render('updatepassword',{
            login: true,
            name: req.session.name,
            id: req.session.idD,
            datos: usuario,
            listapacientes : req.session.pacientes
        });
    }
})

//Update password
router.post('/actualizarcontrasena', async (req, res)=>{
    
    let passwordHash = await bcryptsjs.hash(req.body.newpassword, 8);

    const datos = {
        user_name : req.session.user_name,
        pass : req.body.password,
        newpass : passwordHash
    }

    if(datos.pass && datos.newpass){
        const results = await coneccion.query(datos.user_name);
        if(results.length == 0 || !(await bcryptsjs.compare(datos.pass, results[0].password))){
            res.render('updatepassword',{
            alert: true,
            alertTitle: "Error",
            alertMessage: "Usuario y/o Contraseña Incorrectas",
            alertIcon: 'error',
            showConfirmButton: false,
            time: 1000,
            ruta: 'updatepassword'
            });
        }else{
            coneccion.updatepass(datos, req.session.idD).then(result => {
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
        }
    }else{
        res.send('Por favor, ingrese contraseña');
    }

})

//logout
router.get('/logout', (req, res)=>{
    res.clearCookie('token');
    req.session.destroy(()=>{
        res.redirect('/');
    });
})

module.exports = router;