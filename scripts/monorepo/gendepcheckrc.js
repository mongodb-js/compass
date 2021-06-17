const fs = require('fs');

const report = require('../../tmp/depcheck-report.json');

for (const package of report) {
  const deps = Array.from(new Set([...package.depcheck.dependencies, ...package.depcheck.devDependencies]));

  fs.writeFileSync(`${package.location}/.depcheckrc`, `ignores: ${JSON.stringify(deps, null, 2)}
`);
}
