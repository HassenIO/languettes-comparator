const fs = require('fs');
const _ = require('lodash');
require('dotenv').config();

const params = require('../lib/params')(process.argv);
const assetsType = params.assetsType;

const readReport = (provider, assetType) => {
    return fs.readFileSync(`./assets/output/${provider}/${assetType}.csv`, 'utf8');
}

const deconstructReport = (report) => {
    return report.split("\n")
        .slice(1) // Remove first line -> Header
        .filter(line => line.length > 0) // Potentially removes last line if empty
        .map(line => {
            const elementsLine = line.split(';');
            return {
                file: elementsLine[0],
                status: elementsLine[1],
                text: elementsLine[2],
                originalData: elementsLine[3],
            }
        });
}

let rekognitionReport = readReport('rekognition', assetsType);
let gcVisionReport = readReport('gc-vision', assetsType);
rekognitionReport = deconstructReport(rekognitionReport);
gcVisionReport = deconstructReport(gcVisionReport);

const rekognitionReportFiles = rekognitionReport.map(report => report.file);
const visionReportFiles = gcVisionReport.map(report => report.file);

const files = _.uniq(rekognitionReportFiles.concat(visionReportFiles));

const overallReport = files.reduce((acc, file) => {
    console.log(file);
    const rekognitionResult = rekognitionReport.find(report => report.file === file) || {text: ''};
    const gcVisionResult = gcVisionReport.find(report => report.file === file) || {text: ''};
    const match = (rekognitionResult.text === '' && gcVisionResult.text === '') ? "NA" : (rekognitionResult.text == gcVisionResult.text) ? "YES" : "NO";
    return acc + `${file};${rekognitionResult.text};${gcVisionResult.text};${match};\n`;
}, "file;rekognition;gc-vision;match;\n");

fs.writeFileSync(`./assets/output/overall/${assetsType}.csv`, overallReport);
