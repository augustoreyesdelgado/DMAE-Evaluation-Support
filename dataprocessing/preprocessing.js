const Jimp = require('jimp');
const cv = require('./opencv.js');

async function procesarImagen(imagePath, fecha) {
  
  const jimpSrc = await Jimp.read(imagePath);

  const src = cv.matFromImageData(jimpSrc.bitmap);

  const resizedImage = changeResolution(src, 300, 300);

  const adjustedImage = adjustBrightnessContrast(resizedImage, 10, 10);
  
  const dstJimp = await jimpFromMat(adjustedImage);
  src.delete();
  resizedImage.delete();
  adjustedImage.delete();

  var n;

  dstJimp.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
    n = buffer;
  });

  return n;
}

function changeResolution(image, newWidth, newHeight) {
  const dst = new cv.Mat();
  cv.resize(image, dst, new cv.Size(newWidth, newHeight), 0, 0, cv.INTER_LINEAR);
  return dst;
}

function adjustBrightnessContrast(image, brightnessPercent, contrastPercent) {
  const brightness = (brightnessPercent / 100) + 1;
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