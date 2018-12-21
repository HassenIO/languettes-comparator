const fs = require('fs');

const params = require('../lib/params')(process.argv);
const assetsType = params.assetsType;

const selectConflicts = overallReport =>
  overallReport.reduce((acc, line) => {
    const [file, rekognition, gcVision, , looseMatch] = line.split(';');
    if (looseMatch === 'LOOSE-NO') acc[file] = { rekognition, gcVision };
    return acc;
  }, {});

const overallReport = fs
  .readFileSync(`./assets/outputs/matches/${assetsType}.csv`, 'utf-8')
  .split('\n');
const conflicts = selectConflicts(overallReport);
fs.writeFileSync(
  `./assets/outputs/conflicts/${assetsType}.json`,
  JSON.stringify(conflicts)
);

const countOriginal = overallReport.length - 2; // Substract header and last blank line
const countConflicts = Object.keys(conflicts).length;
console.log(
  `There are ${countConflicts}/${countOriginal} conflicts for ${assetsType} assets.`
);
