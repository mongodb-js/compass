const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { createWorkspace } = require('./create-workspace');
const { collectWorkspacesMeta } = require('./workspace-dependencies');
const { runInDir } = require('./run-in-dir');

async function convertWorkspace(srcPath) {
  // Load package.json and extract name and description
  const pkg = JSON.parse(fs.readFileSync(path.join(srcPath, 'package.json')));
  const { name, description, private: isPrivate } = pkg;

  // Move the folder to a tmp location
  const tmpPath = path.join(os.tmpdir(), `${name.replace('/', '__')}-tmp`);
  await exec(`mv ${srcPath} ${tmpPath}`);

  console.log('install');
  await runInDir('npm install');

  const workspacesMeta = await collectWorkspacesMeta();
  const [workspaceName, scope] = name.split('/').reverse();
  console.log('createWorkspace');
  // Create a new workspace using the extracted name and description
  const newPath = await createWorkspace({
    name: workspaceName,
    scope,
    description,
    isPublic: !!isPrivate,
    allowJs: true,
    isPlugin: !!pkg.productName,
    isReact: !!pkg?.peerDependencies?.react,
    workspacesMeta: workspacesMeta,
    isConfig: false,
    dependants: [],
    depType: null,
  });

  // Copy the src and test or tests directories to the new workspace
  await exec(`cp ${path.join(tmpPath, 'index.js')} ${newPath}`).catch(
    console.log
  );
  await exec(`cp ${path.join(tmpPath, 'README.md')} ${newPath}`).catch(
    console.log
  );
  await exec(`cp -r ${path.join(tmpPath, 'src')} ${newPath}`).catch(
    console.log
  );
  await exec(`cp -r ${path.join(tmpPath, 'lib')} ${newPath}`).catch(
    console.log
  );
  await exec(`cp -r ${path.join(tmpPath, 'bin')} ${newPath}`).catch(
    console.log
  );
  await exec(
    `cp -r ${path.join(tmpPath, 'test')} ${newPath} || cp -r ${path.join(
      tmpPath,
      'tests'
    )} ${newPath}`
  ).catch(console.log);

  // Delete the tmp folder
  await exec(`rm -rf ${tmpPath}`);

  await runInDir('npm install');
}

if (process.argv.length !== 3) {
  console.error('Please provide a path as the only argument');
  process.exit(1);
}

const inputPath = process.argv[2];

if (!fs.existsSync(inputPath)) {
  console.error(`The provided path does not exist: ${inputPath}`);
  process.exit(1);
}

convertWorkspace(path.resolve(process.cwd(), inputPath));
