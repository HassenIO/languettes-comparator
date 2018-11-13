const fs = require('fs');
const AWS = require('aws-sdk');
const vision = require('@google-cloud/vision');
require('dotenv').config();

const rekognition = new AWS.Rekognition({ region: 'eu-west-1' });
const client = new vision.ImageAnnotatorClient();
const params = require('./lib/params')(process.argv);

const provider = params.provider;
const assetsType = params.assetsType;

const baseDir = process.env.BASE_DIR;
const inputsDir = `${baseDir}/${assetsType}/`;
const reportFile = `${provider}/${assetsType}.csv`;

const reportLocation = `./assets/output/${reportFile}`;
let report;
let processedAssets = [];

if (fs.existsSync(reportLocation)) {
  const reportContent = fs.readFileSync(reportLocation, 'utf8');
  processedAssets = reportContent.split("\n").map(line => line.split(';')[0]);
  report = fs.createWriteStream(reportLocation, {flags: 'a'});
} else {
  report = fs.createWriteStream(reportLocation);
  report.write('file;status;output;full-output;\n');
}

const getTextFromRekognition = async file => {
  const fileName = file.substr(inputsDir.length);
  rekognition.detectText(
    { Image: { Bytes: fs.readFileSync(file) } },
    function(err, data) {
      const originalData = JSON.stringify(data).replace(/\n/g, '');
      let output = false;
      if (err) {
        console.log(`!! Error from Rekognition: err= ${err}`);
      } else if (!data || data === null) {
        console.log(`!! data is null: data= ${data}`);
        output = [ file.substr(inputsDir.length), 'KO', '', originalData ];
      } else if (!data.TextDetections || data.TextDetections.length === 0) {
        console.log(`!! TextDetections is empty: data.TextDetections= ${ data.TextDetections }` );
        output = [ file.substr(inputsDir.length), 'KO', '', originalData ];
      } else {
        const line = data.TextDetections.filter(d => d.Type == 'LINE');
        if (line.length > 0) {
          const text = line[0].DetectedText.replace(/\n/g, '');
          console.log(`Processed ${file} -> ${text}`);
          output = [ file.substr(inputsDir.length), 'OK', text, originalData ];
        } else {
          output = [ file.substr(inputsDir.length), 'KO', '', originalData ];
        }
      }
      if (output) {
        report.write(output.join(';') + ';\n');
      }
    }
  );
};

const getTextFromGCVision = async file => {
  try {
    const textDetection = await client.textDetection(file);
    text = (textDetection && textDetection[0] && textDetection[0].fullTextAnnotation) ? textDetection[0].fullTextAnnotation.text.replace(/\n/g, '') : undefined;
    const originalData = JSON.stringify(textDetection).replace(/\n/g, '')
    console.log(`Processed ${file} -> ${text}`);
    if (text) {
      output = [ file.substr(inputsDir.length), 'OK', text, originalData ];
    } else {
      output = [ file.substr(inputsDir.length), 'KO', '', originalData ];
    }
    report.write(output.join(';') + ";\n");
  } catch (error) {
    console.log('Error:', error);
  }
};

let getText;
if (provider === 'rekognition') getText = getTextFromRekognition;
if (provider === 'gc-vision') getText = getTextFromGCVision;

fs.readdirSync(inputsDir)
  .filter(file => file.substr(-4) === '.png')
  .filter(file => !processedAssets.includes(file))
  .map(file => getText(inputsDir + file));
