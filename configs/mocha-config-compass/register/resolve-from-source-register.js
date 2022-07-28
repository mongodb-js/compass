const fs = require('fs');
const path = require('path');
const Module = require('module');

const workspacesDirPath = path.resolve(__dirname, '..', '..', '..', 'packages');

const workspaces = fs
  .readdirSync(workspacesDirPath)
  .filter((workspacesDir) => {
    // Unexpected but seems to be a thing that happens? Ignore hidden files
    return !workspacesDir.startsWith('.');
  })
  .map((workspaceName) => path.join(workspacesDirPath, workspaceName));

const sourcePaths = Object.fromEntries(
  workspaces
    .map((workspacePath) => {
      let packageJson = {};
      try {
        packageJson = require(path.join(workspacePath, 'package.json'));
      } catch (err) {
        console.warn(
          `\x1b[33mWarning: Directory at path "${workspacePath}" is not a workspace. Did you forget to clean up?\x1b[0m`
        );
      }
      if (packageJson['compass:main'] || packageJson['compass:exports']) {
        return [
          packageJson.name,
          path.join(
            workspacePath,
            packageJson['compass:exports']?.['.'] ?? packageJson['compass:main']
          ),
        ];
      }
      return false;
    })
    .filter(Boolean)
);

const origResolveFilename = Module._resolveFilename;

// Resolve the source of the monorepo dependencies when running tests instead of
// dist. This allows us to avoid any additional re-compilation or initial
// bootstrapping when working on multiple packages in the monorepo (this also
// means that we are not importing enormous compiled webpack builds of some
// packages in the monorepo)
Module._resolveFilename = function (request, ...args) {
  return origResolveFilename.call(
    this,
    sourcePaths[request] ?? request,
    ...args
  );
};
