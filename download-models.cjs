const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

let completed = 0;

files.forEach(file => {
  const dest = path.join(modelsDir, file);
  const fileStream = fs.createWriteStream(dest);
  https.get(baseUrl + file, response => {
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      completed++;
      console.log(`Downloaded ${file}`);
      if(completed === files.length) {
         console.log('All models downloaded.');
      }
    });
  }).on('error', err => {
    fs.unlink(dest, () => {});
    console.error(`Error downloading ${file}: ${err.message}`);
  });
});
