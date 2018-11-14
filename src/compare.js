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

let overallReport = files.map(file => {
    const rekognitionResult = rekognitionReport.find(report => report.file === file) || {text: ''};
    const gcVisionResult = gcVisionReport.find(report => report.file === file) || {text: ''};
    return [file, rekognitionResult.text, gcVisionResult.text].join(';') + ";";
});

fs.writeFileSync(`./assets/output/overall/${assetsType}.csv`, overallReport.join("\n"));
