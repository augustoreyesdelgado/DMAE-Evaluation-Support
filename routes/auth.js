const express = require('express');
const router = express.Router();
//captura de datos para el formulario
router.use(express.json());
router.use(express.urlencoded({extended: true}));
//invocar dotenn
const dotenv = require('dotenv');
dotenv.config({path:'.env/.env'})
//directorio publico
router.use('../resources', express.static('public'));
router.use('../resources', express.static(__dirname + 'public'));
//bcryptsjs
const bcryptsjs = require('bcryptjs');
//Invocar coneccion a base de datos
const coneccion = require('../DB/db');
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

//logout
router.get('/logout', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/');
    });
})

module.exports = router;