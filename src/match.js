const fs = require('fs');
const _ = require('lodash');
require('dotenv').config();

const params = require('../lib/params')(process.argv);
const assetsType = params.assetsType;

const readReport = (provider, assetType) => {
  return fs.readFileSync(
    `./assets/outputs/extracts/${provider}/${assetType}.csv`,
    'utf8'
  );
};

const deconstructReport = report => {
  return report
    .split('\n')
    .slice(1) // Remove first line -> Header
    .filter(line => line.length > 0) // Potentially removes last line if empty
    .map(line => {
      const elementsLine = line.split(';');
      return {
        file: elementsLine[0],
        status: elementsLine[1],
        text: elementsLine[2]
      };
    });
};

const rekognitionReport = deconstructReport(
  readReport('rekognition', assetsType)
);
const gcVisionReport = deconstructReport(readReport('gc-vision', assetsType));
const rekognitionReportFiles = rekognitionReport.map(report => report.file);
const visionReportFiles = gcVisionReport.map(report => report.file);

const files = _.uniq(rekognitionReportFiles.concat(visionReportFiles));

const overallReport = files.reduce((acc, file) => {
  const originalFile = file.substr(0, file.length - 5);
  console.log(`Checking file ${originalFile}`);
  const rekognitionResult = rekognitionReport.find(
    report => report.file === file
  ) || { text: '' };
  const gcVisionResult = gcVisionReport.find(
    report => report.file === file
  ) || { text: '' };
  const match =
    rekognitionResult.text === '' && gcVisionResult.text === ''
      ? 'NA'
      : rekognitionResult.text == gcVisionResult.text
      ? 'YES'
      : 'NO';
  return (
    acc +
    `${originalFile};${rekognitionResult.text};${
      gcVisionResult.text
    };${match};\n`
  );
}, 'file;rekognition;gc-vision;match;\n');

fs.writeFileSync(`./assets/outputs/matches/${assetsType}.csv`, overallReport);
