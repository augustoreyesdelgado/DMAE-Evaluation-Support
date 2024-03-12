const Jimp = require('jimp');
const cv = require('./opencv.js');

async function procesarImagen(imagePath, fecha) {
  // Carga una imagen local con Jimp
  
  const jimpSrc = await Jimp.read(imagePath);

  // Ajusta el brillo y el contraste de la imagen
  //jimpSrc.contrast(0.2); // Modifica el factor de contraste según sea necesario
  //jimpSrc.brightness(0.05); // Modifica el factor de brillo según sea necesario

  // Cambia el tamaño de la imagen a 300x300 píxeles
  //jimpSrc.resize(300, 300);

  // Crea un objeto `cv.Mat` desde los datos de imagen de Jimp
  const src = cv.matFromImageData(jimpSrc.bitmap);

  // Ahora puedes continuar con tus operaciones de OpenCV en el objeto `src`
  // Cambiar la resolución a 300x300
  const resizedImage = changeResolution(src, 300, 300);

  // Ajustar brillo y contraste
  const adjustedImage = adjustBrightnessContrast(resizedImage, 15, 30);

  // Después de terminar con las operaciones de OpenCV, convierte el objeto `Mat` resultante a una imagen Jimp y guárdala
  const dstJimp = await jimpFromMat(adjustedImage);
  src.delete();
  resizedImage.delete();
  adjustedImage.delete();

  var n;

  dstJimp.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
    n = buffer;
  });

  return n;
   // Libera la memoria del objeto `Mat`
}

// Función para cambiar la resolución de la imagen
function changeResolution(image, newWidth, newHeight) {
  const dst = new cv.Mat();
  cv.resize(image, dst, new cv.Size(newWidth, newHeight), 0, 0, cv.INTER_LINEAR);
  return dst;
}

// Función para ajustar el brillo y el contraste de la imagen
function adjustBrightnessContrast(image, brightnessPercent, contrastPercent) {
  const brightness = brightnessPercent / 100 * 255;
  const contrast = (contrastPercent / 100) + 1;
  const dst = new cv.Mat();
  image.convertTo(dst, -1, contrast, brightness);
  return dst;
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