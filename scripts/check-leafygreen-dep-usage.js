const {
  collectWorkspacesMeta,
  collectWorkspacesDependencies,
} = require('./workspace-dependencies');

const compassComponentsWorkspaceName = '@mongodb-js/compass-components';

// Checks if any package except "compass-components" try to require
// a `leafygreen-ui` or `emotion` dependency.
async function main() {
  const workspaces = await collectWorkspacesMeta();
  const dependencies = collectWorkspacesDependencies(workspaces);
  const leafyGreenDependencies = [...dependencies].filter(
    ([depName]) =>
      depName.includes('@leafygreen') || depName.includes('@emotion')
  );

  for (const [depName, versionsInUse] of leafyGreenDependencies) {
    for (const dependencyEntry of versionsInUse)
      if (
        [
          compassComponentsWorkspaceName,
          // TODO: compass-shell requires @leafygreen-ui/code to be installed as
          // a dependency until we change how browser-repl is bundled
          // https://jira.mongodb.org/browse/COMPASS-5535
          '@mongodb-js/compass-shell',
        ].includes(dependencyEntry.workspace) === false
      ) {
        process.exitCode = 1;
        console.error(
          `The package "${dependencyEntry.workspace}" has the dependency "${depName}" in its ${dependencyEntry.type} dependencies.`
        );
        console.error(
          `LeafyGreen and Emotion dependencies should be limited to the "${compassComponentsWorkspaceName}" workspace so that they can be more easily deduped and versions can be shared.`
        );
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
