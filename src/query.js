const path = require('path');
const fs = require('fs');
const request = require('request-promise');
const AWS = require('aws-sdk');
const vision = require('@google-cloud/vision');
require('dotenv').config();

const rekognition = new AWS.Rekognition({ region: 'eu-west-1' });
const visionClient = new vision.ImageAnnotatorClient();
const tesseractURL = process.env.TESSERACT_URL;
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
    const data = await visionClient.textDetection(file);
    saveQueryOutput(file.substr(inputsDir.length), data);
  } catch (err) {
    console.log(`!! Error from GC Vision: err= ${err}`);
  }
};

const getTextFromTesseract = async file => {
  try {
    const fileContent = fs.readFileSync(file).toString('base64');
    const data = await request({
      method: 'POST',
      url: tesseractURL,
      body: JSON.stringify({ img_base64: fileContent })
    });
    saveQueryOutput(file.substr(inputsDir.length), data);
  } catch (err) {
    console.log(`!! Error from Tesseract: err= ${err}`);
  }
};

let getText;
if (provider === 'rekognition') getText = getTextFromRekognition;
if (provider === 'gc-vision') getText = getTextFromGCVision;
if (provider === 'tesseract') getText = getTextFromTesseract;

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
