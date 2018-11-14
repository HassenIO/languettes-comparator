const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const vision = require('@google-cloud/vision');
require('dotenv').config();

const rekognition = new AWS.Rekognition({ region: 'eu-west-1' });
const client = new vision.ImageAnnotatorClient();
const params = require('../lib/params')(process.argv);

// Extracting CLI params of form key=value
const provider = params.provider;
const assetsType = params.assetsType;
console.log(`-- Using provider: ${provider}`);
console.log(`-- On assets: ${assetsType}`);

const inputsDir = `${process.env.BASE_DIR}/${assetsType}/`;
const outputDir = path.resolve(
  __dirname,
  `../assets/outputs/queries/${provider}/${assetsType}/`
);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const saveQueryOutput = (file, data) => {
  console.log(`Processed file: ${file}`);
  fs.writeFileSync(`${outputDir}/${file}.json`, JSON.stringify(data) || 'null');
};

const getTextFromRekognition = async file => {
  rekognition.detectText({ Image: { Bytes: fs.readFileSync(file) } }, function(
    err,
    data
  ) {
    if (err) {
      console.log(`!! Error from Rekognition: err= ${err}`);
    } else {
      saveQueryOutput(file.substr(inputsDir.length), data);
    }
  });
};

const getTextFromGCVision = async file => {
  try {
    const data = await client.textDetection(file);
    saveQueryOutput(file.substr(inputsDir.length), data);
  } catch (err) {
    console.log(`!! Error from GC Vision: err= ${err}`);
  }
};

let getText;
if (provider === 'rekognition') getText = getTextFromRekognition;
if (provider === 'gc-vision') getText = getTextFromGCVision;

const processedAssets = fs
  .readdirSync(outputDir)
  .filter(file => file.substr(-5) === '.json')
  .map(file => file.substr(0, file.length - 5));

console.log(`-- Already processed: ${processedAssets.length} items`);

const assetsToBeProcessed = fs
  .readdirSync(inputsDir)
  .filter(file => file.substr(-4) === '.png')
  .filter(file => !processedAssets.includes(file))
  .map(file => getText(inputsDir + file));

console.log(`-- Items to be processed: ${assetsToBeProcessed.length} items`);
