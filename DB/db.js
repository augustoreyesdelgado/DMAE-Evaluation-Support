const postgresql = require('postgresql');
require('dotenv').config({path:'./env/.env'});

const dbconfig = {
    host: process.env.POSTGRESQL_HOST,
    user: process.env.POSTGRESQL_USER,
    password: process.env.POSTGRESQL_PASSWORD,
    database: process.env.POSTGRESQL_DB
}

const { Pool } = require('pg');
const { text } = require('express');

function conpostgresql() {
    const pool = new Pool(dbconfig);

    pool.connect((err, client, release) => {
        if (err) {
            console.error('[db err]', err);
            setTimeout(conpostgresql, 200);
        } else {
            console.log('DB Conectada');
        }
    });

    pool.on('error', (err, client) => {
        console.error('[db err]', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            conpostgresql();
        } else {
            throw err;
        }
    });
}

async function agregar(tabla, data){
    const id = await insert(tabla, {user_name: data.user_name, cedula: data.cedula});
    await insert('datos_generales', {id: id[0].id, name: data.name, flastname: data.flastname, slastname: data.slastname, birthdate: data.birthdate, state: data.state, city: data.city, type: data.type});
    return insert('auth', {id: id[0].id, password: data.pass});
}

async function agregarP(data){
    const id = await insert('pacientes', {idd: data.idD, gender: data.gender});
    return await insert('datos_generales', {id: id[0].id, name: data.name, flastname: data.flastname, slastname: data.slastname, birthdate: data.birthdate, state: data.state, city: data.city, type: data.type});
}

function insert(tabla, data){
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig); // Crear una nueva pool para cada consulta
        const keys = Object.keys(data); // Obtener las claves (nombres de columnas) del objeto data
        const values = Object.values(data); // Obtener los valores del objeto data
        const placeholders = keys.map((key, index) => `$${index + 1}`).join(','); // Crear marcadores de posición para los valores
        //console.log("llegó a agregar con ",tabla);
        const query = {
            text: `INSERT INTO ${tabla} (${keys.join(',')}) VALUES (${placeholders}) RETURNING id`, // Construir la consulta SQL dinámicamente
            values: values,
        };
        pool.query(query, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

async function updateu(data, id){
    await actualizar('usuarios', {user_name: data.user_name}, id);
    return await actualizar('datos_generales', {name: data.name, flastname: data.flastname, slastname: data.slastname, birthdate: data.birthdate, state: data.state, city: data.city, type: data.type}, id);
}

async function updatep(data, id){ 
    await actualizar('pacientes', {gender: data.gender}, id);
    return await actualizar('datos_generales', {name: data.name, flastname: data.flastname, slastname: data.slastname, birthdate: data.birthdate, state: data.state, city: data.city, type: data.type}, id);
}

function actualizar(tabla, data, id) {
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig);
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(',');
        values.push(id);
        const query = {
            text: `UPDATE ${tabla} SET ${setClause} WHERE id = $${values.length}`,
            values: values
        };
        pool.query(query, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}


function query(user_name){
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig); // Crear una nueva pool para cada consulta
        pool.query(`SELECT us.id, us.user_name, au.password, ge.* 
        FROM usuarios as us 
        INNER JOIN auth as au ON us.id = au.id 
        INNER JOIN datos_generales as ge ON us.id = ge.id 
        WHERE us.user_name = '${user_name}';
        `, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function usuario(id){
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig); // Crear una nueva pool para cada consulta
        pool.query(`SELECT us.id, us.user_name, us.cedula, ge.name, ge.flastname, ge.slastname, ge.birthdate, ge.state, ge.city 
        FROM usuarios as us 
        INNER JOIN auth as au ON us.id = au.id 
        INNER JOIN datos_generales as ge ON us.id = ge.id 
        WHERE us.id = '${id}';
        `, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function pacientes(idd){
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig); // Crear una nueva pool para cada consulta
        pool.query(`SELECT pa.id, pa.gender, ge.name, ge.flastname, ge.slastname, ge.birthdate, ge.state, ge.city 
        FROM pacientes as pa 
        INNER JOIN datos_generales as ge ON ge.id = pa.id 
        WHERE pa.idd = '${idd}';
        `, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function patientsfiltered(idd, data){
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig); // Crear una nueva pool para cada consulta
        var query;
        if(data.fecha==''){
        query = {
            text : `SELECT 
            pa.id, pa.gender, ge.name, ge.flastname, ge.slastname, ge.birthdate, ge.state, ge.city 
        FROM 
            pacientes AS pa 
        INNER JOIN 
            datos_generales AS ge ON ge.id = pa.id 
        WHERE 
            pa.idd = '${idd}' 
        AND 
            (
                CASE 
                    WHEN '${data.genero}' = '' THEN TRUE
                    ELSE pa.gender = '${data.genero}'
                END
            )
        AND 
            (
                CASE 
                    WHEN '${data.nombre}' = '' THEN TRUE
                    ELSE LOWER(ge.name || ' ' || ge.flastname || ' ' || ge.slastname) LIKE LOWER('%${data.nombre}%')
                END
            );`
        }
        }else{
            query = {
                text : `SELECT 
                pa.id, pa.gender, ge.name, ge.flastname, ge.slastname, ge.birthdate, ge.state, ge.city 
            FROM 
                pacientes AS pa 
            INNER JOIN 
                datos_generales AS ge ON ge.id = pa.id 
            WHERE 
                pa.idd = '${idd}' 
            AND 
                (
                    CASE 
                        WHEN '${data.genero}' = '' THEN TRUE
                        ELSE pa.gender = '${data.genero}'
                    END
                )
            AND 
                (
                    CASE 
                        WHEN '${data.nombre}' = '' THEN TRUE
                        ELSE LOWER(ge.name || ' ' || ge.flastname || ' ' || ge.slastname) LIKE LOWER('%${data.nombre}%')
                    END
                )
            AND 
                (
                    ge.birthdate = '${data.fecha}'
                );`
            }
        }
        pool.query(query, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function reportsfiltered(idd, data){
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig); // Crear una nueva pool para cada consulta
        var query;
        if(data.fecha==''){
        query = {
            text : `SELECT r.id, r.acuracy, dg.name, dg.flastname, dg.slastname, r.analys_date, r.phase, pa.idd
            FROM reportes r
            JOIN pacientes pa ON r.id_p = pa.id
            JOIN datos_generales dg ON pa.id = dg.id
             WHERE pa.idd = '${idd}'
        AND 
            (
                CASE 
                    WHEN '${data.afeccion}' = '' THEN TRUE
                    ELSE r.phase = '${data.afeccion}'
                END
            )
        AND 
            (
                CASE 
                    WHEN '${data.nombre}' = '' THEN TRUE
                    ELSE LOWER(dg.name || ' ' || dg.flastname || ' ' || dg.slastname) LIKE LOWER('%${data.nombre}%')
                END
            );`
        }
        }else{
            query = {
                text : `SELECT r.id, r.acuracy, dg.name, dg.flastname, dg.slastname, r.analys_date, r.phase, pa.idd
                FROM reportes r
                JOIN pacientes pa ON r.id_p = pa.id
                JOIN datos_generales dg ON pa.id = dg.id
                 WHERE pa.idd = '${idd}'
            AND 
                (
                    CASE 
                        WHEN '${data.afeccion}' = '' THEN TRUE
                        ELSE r.phase = '${data.afeccion}'
                    END
                )
            AND 
                (
                    CASE 
                        WHEN '${data.nombre}' = '' THEN TRUE
                        ELSE LOWER(dg.name || ' ' || dg.flastname || ' ' || dg.slastname) LIKE LOWER('%${data.nombre}%')
                    END
                )
            AND 
                (
                    r.analys_date = '${data.fecha}'
                );`
            }
        }
        pool.query(query, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function paciente(id){
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig); // Crear una nueva pool para cada consulta
        pool.query(`SELECT pa.id, pa.gender, ge.name, ge.flastname, ge.slastname, ge.birthdate, ge.state, ge.city 
        FROM pacientes as pa 
        INNER JOIN datos_generales as ge ON ge.id = pa.id 
        WHERE pa.id = '${id}';
        `, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function reportes(idd){
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig); // Crear una nueva pool para cada consulta
        pool.query(`SELECT r.id, r.acuracy, dg.name, dg.flastname, dg.slastname, r.analys_date, r.phase, pa.idd
        FROM reportes r
        JOIN pacientes pa ON r.id_p = pa.id
        JOIN datos_generales dg ON pa.id = dg.id
         WHERE pa.idd = '${idd}';
        `, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function reporte(id,idd){
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig); // Crear una nueva pool para cada consulta
        pool.query(`SELECT r.id, r.acuracy, r.image, r.side, dg.name, dg.flastname, dg.slastname, pa.gender, dg.birthdate, r.analys_date, r.phase
        FROM reportes r
        JOIN pacientes pa ON r.id_p = pa.id
        JOIN datos_generales dg ON pa.id = dg.id
         WHERE r.id='${id}' and pa.idd = '${idd}';
        `, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function eliminar(id){
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig); // Crear una nueva pool para cada consulta
        pool.query(`DELETE FROM reportes WHERE id = '${id}';`, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

async function eliminarp(id){
    await eliminar1('reportes', 'id_p',id);
    await eliminar1('pacientes', 'id',id);
    return await eliminar1('datos_generales', 'id', id);
}

function eliminar1(tabla,identificador,id){
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig); // Crear una nueva pool para cada consulta
        pool.query(`DELETE FROM ${tabla} WHERE ${identificador} = '${id}';`, (error, result) => {
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

module.exports = {
    agregar,
    agregarP,
    query,
    pacientes,
    paciente,
    updatep,
    reportes,
    eliminar,
    eliminarp,
    usuario,
    updateu,
    reporte,
    patientsfiltered,
    reportsfiltered,
    insert
}