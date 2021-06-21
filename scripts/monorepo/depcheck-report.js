const childProcess = require('child_process');
const packages = JSON.parse(childProcess.execSync('lerna list --all --json --toposort'));
const report = [];

for (const package of packages) {
  try {
    const result = JSON.parse(childProcess.execSync('depcheck --json', {cwd: package.location}).toString());
    report.push({...package, depcheck: result});
  } catch (e) {
    const out = e.output.toString();
    report.push({...package, depcheck: JSON.parse(out.slice(1, out.length - 1))});
  }
}

console.log(JSON.stringify(report, null, 2));