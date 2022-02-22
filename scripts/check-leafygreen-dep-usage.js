const {
  collectWorkspacesMeta,
  collectWorkspacesDependencies
} = require('./workspace-dependencies');

const compassComponentsWorkspaceName = '@mongodb-js/compass-components';

// Checks if any package except "compass-components" try to require
// a leafygreen-ui dependency.
async function main() {
  const workspaces = await collectWorkspacesMeta();
  const dependencies = collectWorkspacesDependencies(workspaces);
  const leafyGreenDependencies = [...dependencies].filter(
    ([depName]) => depName.includes('leafygreen')
  );

  for (const [depName, versionsInUse] of leafyGreenDependencies) {
    for (const dependencyEntry of versionsInUse)
    if (dependencyEntry.workspace !== compassComponentsWorkspaceName) {
      process.exitCode = 1;
      console.error(`The package "${dependencyEntry.workspace}" has the LeafyGreen dependency "${depName}" in its ${dependencyEntry.type} dependencies.`);
      console.error(`LeafyGreen dependencies should be limited to the "${compassComponentsWorkspaceName}" workspace so that they can be more easily deduped and versions can be shared.`);
      console.error(`"${depName}": "${dependencyEntry.version}"`);
    }
  }
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

main();
