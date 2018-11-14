const fs = require('fs');
const path = require('path');
const params = require('../lib/params')(process.argv);

const provider = params.provider;
const assetsType = params.assetsType;

const inputsDir = path.resolve(
  __dirname,
  `../assets/outputs/queries/${provider}/${assetsType}/`
);
const outputDir = path.resolve(
  __dirname,
  `../assets/outputs/extracts/${provider}/`
);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
const report = fs.createWriteStream(outputDir + `/${assetsType}.csv`);
report.write('file;status;text;confidence;\n');

const extractText = file => {
  const content = fs.readFileSync(file);
  if (content === 'null') writeExtract(file, content);
  else {
    if (provider === 'rekognition') {
      const lines = JSON.parse(content).TextDetections.filter(
        detection => detection.Type === 'LINE'
      );
      if (lines.length > 0) {
        const bestPrediction = lines.reduce(
          (final, line) => (line.Confidence >= final.Confidence ? line : final),
          { Confidence: 0 }
        );
        writeExtract(
          file,
          bestPrediction.DetectedText,
          bestPrediction.Confidence
        );
      } else writeExtract(file, '');
    } else if (provider === 'gc-vision') {
      const annotation = JSON.parse(content).find(
        detection =>
          detection.fullTextAnnotation && detection.fullTextAnnotation.text
      );
      if (annotation) {
        const text = annotation.fullTextAnnotation.text.replace(/\n/g, '');
        writeExtract(file, text);
      } else writeExtract(file, '');
    } else console.log('-- Not valid provider');
  }
};

const writeExtract = (file, text, confidence = 'NA') => {
  if (text === 'null') text = '';
  const status = !!text ? 'OK' : 'KO';
  const fileName = file.substr(inputsDir.length + 1);
  report.write(`${fileName};${status};${text};${confidence};\n`);
};

fs.readdirSync(inputsDir)
  .filter(file => file.substr(-5) === '.json')
  .map(file => extractText(`${inputsDir}/${file}`));
