const fs = require('fs');
const path = require('path');
const Module = require('module');

const workspacesDirPath = path.resolve(__dirname, '..', '..', '..', 'packages');

const workspaces = fs
  .readdirSync(workspacesDirPath)
  .map((workspaceName) => path.join(workspacesDirPath, workspaceName));

const sourcePaths = Object.fromEntries(
  workspaces
    .map((workspacePath) => {
      const packageJson = require(path.join(workspacePath, 'package.json'));
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
