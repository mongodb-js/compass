const fs = require('fs');

const report = require('../../tmp/depcheck-report.json');

for (const packageInfo of report) {
  const deps = Array.from(new Set([...packageInfo.depcheck.dependencies, ...packageInfo.depcheck.devDependencies]));

  fs.writeFileSync(`${packageInfo.location}/.depcheckrc`, `ignores: ${JSON.stringify(deps, null, 2)}
`);
}
