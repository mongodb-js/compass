/* eslint-disable no-console */
/* eslint-disable no-sync */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const pluginPath = path.resolve(__dirname, '..');
const compassPath = path.resolve(pluginPath, 'compass');
const compassRepo = 'https://github.com/mongodb-js/compass.git';

function main() {
  syncCompassMaster();
  linkPlugin();
  installDeps();
  linkReact();
  recompile();
  startCompass();
}

function installDeps() {
  execSync('npm install', {
    cwd: compassPath,
    stdio: 'inherit'
  });
}

function linkPlugin() {
  const compassPackageJsonPath = path.resolve(compassPath, 'package.json');
  const compassPackageJson = JSON.parse(fs.readFileSync(compassPackageJsonPath, 'utf-8'));
  const pluginPackageJsonPath = path.resolve(pluginPath, 'package.json');
  const pluginPackageJson = JSON.parse(fs.readFileSync(pluginPackageJsonPath, 'utf-8'));

  compassPackageJson.dependencies[pluginPackageJson.name] = `file:${pluginPath}`;

  const pluginLoadPath = `node_modules/${pluginPackageJson.name}`;
  const plugins = compassPackageJson.config.hadron.distributions.compass.plugins;

  if (!plugins.includes(pluginLoadPath)) {
    plugins.push(pluginLoadPath);
  }

  fs.writeFileSync(compassPackageJsonPath, JSON.stringify(compassPackageJson));
}

function syncCompassMaster() {
  if (!directoryExists(compassPath)) {
    return cloneCompass();
  }

  resetCompass();
}

function resetCompass() {
  if (!directoryExists(compassPath)) {
    return;
  }

  execSync('git checkout master', { cwd: compassPath });
  execSync('git fetch', { cwd: compassPath });
  execSync('git reset --hard origin/master', { cwd: compassPath });
}

function cloneCompass() {
  console.log(`Cloning compass master to ${compassPath}`);
  execSync(`git clone ${compassRepo} ${compassPath}`);
}

function startCompass() {
  execSync('npm run start', {
    cwd: compassPath,
    stdio: 'inherit'
  });
}

function recompile() {
  execSync('npm run compile', {
    cwd: pluginPath,
    stdio: 'inherit'
  });
}

function directoryExists(directoryPath) {
  return fs.existsSync(directoryPath) && fs.lstatSync(directoryPath).isDirectory();
}

function linkReact() {
  const compassReactPath = path.resolve(compassPath, 'node_modules', 'react');

  if (!directoryExists(compassReactPath)) {
    return;
  }

  const pluginReactPath = path.resolve(pluginPath, 'node_modules', 'react');

  if (fs.existsSync(pluginReactPath)) {
    execSync(`rm -Rf ${pluginReactPath}`);
  }

  fs.symlinkSync(compassReactPath, pluginReactPath);
}

main();
