const path = require('path');
const { promises: fs } = require('fs');

function gatherPathsRec(exports = {}) {
  if (typeof exports === 'string') {
    return [exports];
  }
  return [...Object.values(exports)]
    .map((subpathOrCondition) => {
      return gatherPathsRec(subpathOrCondition);
    })
    .flat();
}

async function main() {
  const packageJson = require(path.resolve(process.cwd(), 'package.json'));

  const pathsToCheck = new Set(
    [
      packageJson.main,
      packageJson.module,
      packageJson.browser,
      packageJson.types,
      ...gatherPathsRec(packageJson.exports),
      ...gatherPathsRec(packageJson.bin),
    ]
      .filter(Boolean)
      .map((exportPath) => exportPath.replace(/^\.\//, ''))
  );

  for (const exportPath of pathsToCheck.values()) {
    try {
      await fs.stat(exportPath);
    } catch {
      throw new Error(
        `Export path "${exportPath}" provided in package.json can't be resolved, this might cause issues for external library users. Either make sure that path exists or remove it from the package.json`
      );
    }
  }

  console.log(`All exports in package ${packageJson.name} exist`);
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

main();
