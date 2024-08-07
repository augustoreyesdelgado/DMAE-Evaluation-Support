require('dotenv').config({path:'./env/.env'});
const { Pool } = require('pg');

const dbconfig = {
    host: process.env.POSTGRESQL_HOST,
    user: process.env.POSTGRESQL_USER,
    password: process.env.POSTGRESQL_PASSWORD,
    database: process.env.POSTGRESQL_DB
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
            pool.end();
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

async function updateu(data, id){
    await actualizar('usuarios', {user_name: data.user_name}, id);
    return await actualizar('datos_generales', {name: data.name, flastname: data.flastname, slastname: data.slastname, birthdate: data.birthdate, state: data.state, city: data.city, type: data.type}, id);
}

async function updatepass(data, id){
    return await actualizar('auth', {password: data.newpass}, id);
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
            pool.end();
            return error ? reject(error) : resolve(result.rows);
        });
    });
}


function query(user_name) {
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig);
        const query = {
            text: `SELECT us.id, us.user_name, us.cedula, au.password, ge.* 
                   FROM usuarios as us 
                   INNER JOIN auth as au ON us.id = au.id 
                   INNER JOIN datos_generales as ge ON us.id = ge.id 
                   WHERE us.user_name = $1`,
            values: [user_name]
        };
        pool.query(query, (error, result) => {
            pool.end();
            return error ? reject(error) : resolve(result.rows);
        });
    });
}


function usuario(id) {
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig);
        const query = {
            text: `SELECT us.id, us.user_name, us.cedula, ge.name, ge.flastname, ge.slastname, TO_CHAR(ge.birthdate, 'YYYY-MM-DD') AS birthdate, ge.state, ge.city 
                   FROM usuarios as us 
                   INNER JOIN auth as au ON us.id = au.id 
                   INNER JOIN datos_generales as ge ON us.id = ge.id 
                   WHERE us.id = $1`,
            values: [id]
        };
        pool.query(query, (error, result) => {
            pool.end();
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function pacientes(idd) {
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig);
        const query = {
            text: `SELECT pa.id, pa.gender, ge.name, ge.flastname, ge.slastname, ge.birthdate, ge.state, ge.city 
                   FROM pacientes as pa 
                   INNER JOIN datos_generales as ge ON ge.id = pa.id 
                   WHERE pa.idd = $1`,
            values: [idd]
        };
        pool.query(query, (error, result) => {
            pool.end();
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function patientsfiltered(idd, data) {
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig);
        let queryText = `SELECT pa.id, pa.gender, ge.name, ge.flastname, ge.slastname, ge.birthdate, ge.state, ge.city 
                         FROM pacientes AS pa 
                         INNER JOIN datos_generales AS ge ON ge.id = pa.id 
                         WHERE pa.idd = $1`;
        let queryParams = [idd];
        let paramIndex = 2;

        if (data.genero) {
            queryText += ` AND pa.gender = $${paramIndex++}`;
            queryParams.push(data.genero);
        }

        if (data.ciudad) {
            queryText += ` AND ge.city = $${paramIndex++}`;
            queryParams.push(data.ciudad);
        }

        if (data.estado) {
            queryText += ` AND ge.state = $${paramIndex++}`;
            queryParams.push(data.estado);
        }

        if (data.nombre) {
            queryText += ` AND LOWER(ge.name || ' ' || ge.flastname || ' ' || ge.slastname) LIKE LOWER($${paramIndex++})`;
            queryParams.push(`%${data.nombre}%`);
        }

        if (data.fecha) {
            queryText += ` AND ge.birthdate = $${paramIndex++}`;
            queryParams.push(data.fecha);
        }

        const query = {
            text: queryText,
            values: queryParams
        };

        pool.query(query, (error, result) => {
            pool.end();
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

const validTables = ['reportes'];
const validColumns = ['id', 'idd', 'acuracy', 'analys_date', 'phase', 'id_p', 'name', 'flastname', 'slastname'];

function isValidInput(value, validList) {
  return validList.includes(value);
}

function reportsfiltered(idd, data) {
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig);

        if (!isValidInput('reportes', validTables) || !isValidInput('idd', validColumns)) {
            return reject(new Error('Tabla o columna inválida'));
        }

        let queryText = `SELECT r.id, r.acuracy, dg.name, dg.flastname, dg.slastname, r.analys_date, r.phase, pa.idd
                         FROM reportes r
                         JOIN pacientes pa ON r.id_p = pa.id
                         JOIN datos_generales dg ON pa.id = dg.id
                         WHERE pa.idd = $1`;
        let queryParams = [idd];
        let paramIndex = 2;

        if (data.afeccion && isValidInput('phase', validColumns)) {
            queryText += ` AND r.phase = $${paramIndex++}`;
            queryParams.push(data.afeccion);
        }

        if (data.nombre) {
            queryText += ` AND LOWER(dg.name || ' ' || dg.flastname || ' ' || dg.slastname) LIKE LOWER($${paramIndex++})`;
            queryParams.push(`%${data.nombre}%`);
        }

        if (data.fecha && isValidInput('analys_date', validColumns)) {
            queryText += ` AND r.analys_date = $${paramIndex++}`;
            queryParams.push(data.fecha);
        }

        const query = {
            text: queryText,
            values: queryParams
        };

        pool.query(query, (error, result) => {
            pool.end();
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function paciente(id) {
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig);
        const query = {
            text: `SELECT pa.id, pa.gender, ge.name, ge.flastname, ge.slastname, TO_CHAR(ge.birthdate, 'YYYY-MM-DD') AS birthdate, ge.state, ge.city 
                   FROM pacientes as pa 
                   INNER JOIN datos_generales as ge ON ge.id = pa.id 
                   WHERE pa.id = $1`,
            values: [id]
        };
        pool.query(query, (error, result) => {
            pool.end();
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function reportes(idd) {
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig);
        const query = {
            text: `SELECT r.id, r.acuracy, dg.name, dg.flastname, dg.slastname, r.analys_date, r.phase, pa.idd
                   FROM reportes r
                   JOIN pacientes pa ON r.id_p = pa.id
                   JOIN datos_generales dg ON pa.id = dg.id
                   WHERE pa.idd = $1`,
            values: [idd]
        };
        pool.query(query, (error, result) => {
            pool.end();
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function reporte(id, idd) {
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig);
        const query = {
            text: `SELECT r.id, r.acuracy, r.image, r.side, dg.name, dg.flastname, dg.slastname, pa.gender, dg.birthdate, r.analys_date, r.phase
                   FROM reportes r
                   JOIN pacientes pa ON r.id_p = pa.id
                   JOIN datos_generales dg ON pa.id = dg.id
                   WHERE r.id = $1 AND pa.idd = $2`,
            values: [id, idd]
        };
        pool.query(query, (error, result) => {
            pool.end();
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

function eliminar(id) {
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig);
        const query = {
            text: `DELETE FROM reportes WHERE id = $1`,
            values: [id]
        };
        pool.query(query, (error, result) => {
            pool.end();
            return error ? reject(error) : resolve(result.rows);
        });
    });
}

async function eliminarp(id){
    await eliminar1('reportes', 'id_p',id);
    await eliminar1('pacientes', 'id',id);
    return await eliminar1('datos_generales', 'id', id);
}

function eliminar1(tabla,identificador,id) {
    return new Promise((resolve, reject) => {
        const pool = new Pool(dbconfig);
        const query = {
            text: `DELETE FROM ${tabla} WHERE ${identificador} = $1`,
            values: [id]
        };
        pool.query(query, (error, result) => {
            pool.end();
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
    insert,
    updatepass
}