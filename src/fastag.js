const fs = require('fs');

const params = require('../lib/params')(process.argv);
const assetsType = params.assetsType;

const selectConflicts = overallReport =>
  overallReport.reduce((acc, line) => {
    const [file, , gcVision, , looseMatch] = line.split(';');
    if (looseMatch === 'LOOSE-NO')
      acc.push(`datasets/languettes/date_de_naissance/${file},"${gcVision}"`);
    return acc;
  }, []);

const overallReport = fs
  .readFileSync(`./assets/outputs/matches/${assetsType}.csv`, 'utf-8')
  .split('\n');
const conflicts = selectConflicts(overallReport);
fs.writeFileSync(
  `./assets/outputs/fastag/${assetsType}.csv`,
  conflicts.join('\n')
);

const countOriginal = overallReport.length - 2; // Substract header and last blank line
const countConflicts = Object.keys(conflicts).length;
console.log(
  `There are ${countConflicts}/${countOriginal} conflicts for ${assetsType} assets.`
);
