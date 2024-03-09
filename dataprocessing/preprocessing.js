const Jimp = require('jimp');
const cv = require('./opencv.js');

async function procesarImagen(imagePath, fecha) {
  // Carga una imagen local con Jimp
  
  const jimpSrc = await Jimp.read(imagePath);

  // Ajusta el brillo y el contraste de la imagen
  jimpSrc.contrast(0.2); // Modifica el factor de contraste según sea necesario
  jimpSrc.brightness(0.05); // Modifica el factor de brillo según sea necesario

  // Cambia el tamaño de la imagen a 300x300 píxeles
  jimpSrc.resize(300, 300);

  // Crea un objeto `cv.Mat` desde los datos de imagen de Jimp
  const src = cv.matFromImageData(jimpSrc.bitmap);

  // Ahora puedes continuar con tus operaciones de OpenCV en el objeto `src`

  // Después de terminar con las operaciones de OpenCV, convierte el objeto `Mat` resultante a una imagen Jimp y guárdala
  const dstJimp = await jimpFromMat(src);
  src.delete();

  var n;

  dstJimp.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
    n = buffer;
  });

  return n;
   // Libera la memoria del objeto `Mat`
}

async function jimpFromMat(mat) {
  return new Promise((resolve, reject) => {
    let srcData = new Uint8ClampedArray(mat.data);
    let dstJimp = new Jimp({
      width: mat.cols,
      height: mat.rows,
      data: srcData
    }, (err, image) => {
      if (err) {
        reject(err);
      } else {
        resolve(image);
      }
    });
  });
}

// Llama a la función `procesarImagen()` cuando desees ejecutar el código
module.exports = {
  procesarImagen
}