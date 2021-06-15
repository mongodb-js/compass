const childProcess = require('child_process');
const path = require('path');
const glob = require('glob');
const fs = require('fs');

function main() {
  const packages = JSON.parse(childProcess.execSync('lerna list --json'));
  for (const package of packages) {
    removeAliases(package);
  }
}

function removeAliases({location: packageLocation}) {
  if(!fs.existsSync(path.join(packageLocation, 'config/project.js'))) {
    return;
  }

  console.log('\nRemoving aliases from', path.relative('.', packageLocation), '...');
  const regex = /from '(actions|components|constants|storybook|models|modules|plugin|stores|utils)([^']*)'/g

  const allJsFiles = glob.sync(
    path.join(packageLocation, '**/*.{js,jsx}'),
    {
      ignore: [
        path.join(packageLocation, 'node_modules/**')
      ]
    }
  );

  let replacementCount = 0;
  for (const filePath of allJsFiles) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const newFileContent = fileContent.replace(regex, (match, folder, rest) => {
      replacementCount++;
      const replacement = getReplacement(packageLocation, folder, rest, filePath);
      console.log('    - ', path.relative(packageLocation, filePath), ':', match, '->', replacement);
      return replacement.replace('//', '/');
    });

    fs.writeFileSync(filePath, newFileContent);
  }

  console.log('Removed', replacementCount, 'aliases');
}

function getReplacement(packageLocation, folder, rest, fromPath) {
  const packageFolders = {
    actions: path.join(packageLocation, 'src', 'actions'),
    components: path.join(packageLocation, 'src', 'components'),
    constants: path.join(packageLocation, 'src', 'constants'),
    models: path.join(packageLocation, 'src', 'models'),
    modules: path.join(packageLocation, 'src', 'modules'),
    plugin: path.join(packageLocation, 'src', 'index.js'),
    stores: path.join(packageLocation, 'src', 'stores'),
    utils: path.join(packageLocation, 'src', 'utils'),
    storybook: path.join(packageLocation, '.storybook'),
  }

  let newPath = path.relative(path.dirname(fromPath), packageFolders[folder]);

  newPath = newPath.startsWith('.') ? newPath : `./${newPath}`;
  const replacement = `from '${newPath}${rest}'`;
  return replacement;
}

main();