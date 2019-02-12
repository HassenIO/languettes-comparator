const fs = require('fs');

const params = require('../lib/params')(process.argv);
const assetsType = params.assetsType;
const provider = params.provider;
if (!['rekognition', 'gc-vision'].includes(provider))
  throw new Error('provider should be either gc-vision or rekognition');

const exportPathPrefix = 'datasets/languettes';

const selectConflicts = overallReport =>
  overallReport.reduce((acc, line) => {
    const [file, rekognition, gcVision, , looseMatch] = line.split(';');
    if (looseMatch === 'LOOSE-NO') {
      const exportEntry = {
        filename: `${exportPathPrefix}-${assetsType}/${file}`,
        name: file,
        expectedOutput: {}
      };
      exportEntry.expectedOutput[assetsType] =
        provider === 'rekognition' ? rekognition : gcVision;

      acc.push(exportEntry);
    }
    return acc;
  }, []);

const overallReport = fs
  .readFileSync(`./assets/outputs/matches/${assetsType}.csv`, 'utf-8')
  .split('\n');
const conflicts = selectConflicts(overallReport);
fs.writeFileSync(
  `./assets/outputs/exports/${assetsType}.json`,
  JSON.stringify(conflicts)
);

const countOriginal = overallReport.length - 2; // Substract header and last blank line
const countConflicts = Object.keys(conflicts).length;
console.log(
  `There are ${countConflicts}/${countOriginal} conflicts for ${assetsType} assets.`
);
