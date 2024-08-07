const moment = require('moment');
const fs = require('fs');

function fecha(fecha, n) {
    const analys_date = new Date(fecha);
    const year = analys_date.getFullYear();
    const month = ('0' + (analys_date.getMonth() + 1)).slice(-2);
    const day = ('0' + analys_date.getDate()).slice(-2);
    const formattedBirthdate = `${year}-${month}-${day}`;
    if (n === 'fecha') {
        return formattedBirthdate;
    } else if (n === 'edad') {
        const age = moment().diff(formattedBirthdate, 'years');
        return age;
    }
}

function fechaActual() {
    const fechaActual = new Date();
    const dia = fechaActual.getDate();
    const mes = fechaActual.getMonth() + 1;
    const año = fechaActual.getFullYear();
    const horas = fechaActual.getHours();
    const minutos = fechaActual.getMinutes();
    const segundos = fechaActual.getSeconds();
    const fechaHoraString = `${año}-${mes}-${dia}-${horas}-${minutos}-${segundos}`;
    const fechaString = `${año}-${mes}-${dia}`;
    const fechas = {
        fechaD: fechaActual,
        fechaS: fechaHoraString,
        fechaSm: fechaString
    };
    return fechas;
}

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

//Crea carpeta
function directorio(id, nombre="", apellido=""){   
    const directoryPath = './public/storage/'+id+nombre+apellido;
    if (!fs.existsSync(directoryPath)) {
        // If it doesn't exist, create the directory
        fs.mkdirSync(directoryPath);
      
        console.log(`Directory '${directoryPath}' created.`);
      } else {
        console.log(`Directory '${directoryPath}' already exists.`);
      }
}

//elimina una imagen
function delimagen(path){   
    const filePath = '.'+path;
    fs.unlink(filePath, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('File is deleted.');
        }
      });
}


//elimina una carpeta
function deldirectorio(id){   
    const directoryPath = './public/storage/'+id;
    fs.rm(directoryPath, { recursive: true, force: true }, err => {
        if (err) {
        throw err;
        }
        console.log(`${directoryPath} is deleted!`);
    });
}

//Actualiza carpeta
function actdirectorio(old_name, new_name){
    const directoryPath = './public/storage/';
    fs.rename(directoryPath+old_name, directoryPath+new_name, err => {
        if (err) {
        console.error(err);
        }
    });
}

module.exports = { 
    fecha, 
    fechaActual, 
    responseAPI, 
    license,
    directorio,
    deldirectorio,
    actdirectorio,
    delimagen
};
