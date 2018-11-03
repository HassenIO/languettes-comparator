const fs = require('fs');
const AWS = require('aws-sdk');
const retry = require('async-retry');
require('dotenv').config();

const rekognition = new AWS.Rekognition({ region: 'eu-west-1' });
const params = require('./lib/params')(process.argv);

const provider = params.provider;
const assetsType = params.assetsType;

const baseDir = process.env.BASE_DIR;
const inputsDir = `${baseDir}/${assetsType}/`;
const reportFile = `${provider}/${assetsType}.csv`;

let report = fs.createWriteStream(`./assets/output/${reportFile}`);
report.write('file;status;output;full-output;\n');

const getTextFromRekognition = async file => {
  await retry(async (bail, num) => {
    rekognition.detectText(
      {
        Image: { Bytes: fs.readFileSync(file) }
      },
      function(err, data) {
        if (err) new Error(`-- Error from Rekognition: err= ${err}`);
        else if (!data || data === null)
          new Error(`-- data is null: data= ${data}`);
        else if (!data.TextDetections || data.TextDetections.length === 0)
          new Error(
            `-- TextDetections is empty: data.TextDetections= ${
              data.TextDetections
            }`
          );
        else {
          const line = data.TextDetections.filter(d => d.Type == 'LINE');
          let output;
          if (line.length > 0) {
            const text = line[0].DetectedText;
            console.log(`Retry ${num}: ${file} -> ${text}`);
            output = [
              file.substr(inputsDir.length),
              'OK',
              text,
              JSON.stringify(data)
            ];
          } else {
            output = [
              file.substr(inputsDir.length),
              'KO',
              '',
              JSON.stringify(data)
            ];
          }

          report.write(output.join(';') + ';\n');
        }
      }
    );
  });
};

fs.readdirSync(inputsDir)
  .filter(f => f.substr(-4) === '.png')
  .map(file => getTextFromRekognition(inputsDir + file));
