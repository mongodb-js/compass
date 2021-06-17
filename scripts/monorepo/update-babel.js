const path = require('path');
const { promises: fs } = require('fs');
const replaceInFile = require('replace-in-file');
const semver = require('semver');
const { forEachPackage } = require('./for-each-package');
const { withProgress } = require('./with-progress');
const { runInDir } = require('../run-in-dir');

function getAllBabelPackages(packageJson) {
  const devDeps = new Map(
    Object.entries(packageJson.devDependencies || {}).filter(([name]) =>
      /^@?babel/.test(name)
    )
  );
  return devDeps;
}

const babelPackagesToInstall = [
  '@babel/core',
  '@babel/preset-env',
  '@babel/preset-react',
  '@babel/plugin-syntax-dynamic-import',
  '@babel/plugin-proposal-decorators',
  'babel-loader@latest'
];

const browserslistrc = `Electron >= 6`;

async function main() {
  await forEachPackage(async ({ location, packageJson }) => {
    const babelRcPath = path.join(location, '.babelrc');
    const babelRcJsPath = path.join(location, '.babelrc.js');
    const browserslistRcPath = path.join(location, '.browserslistrc');

    const babelPackages = getAllBabelPackages(packageJson);
    const allDeps = new Map(
      Object.entries(packageJson.devDependencies || {}).concat(
        packageJson.dependencies || {}
      )
    );

    const babelVersion =
      babelPackages.get('babel-core') ||
      babelPackages.get('babel-cli') ||
      babelPackages.get('@babel/core');

    const babelMajor = babelVersion
      ? semver.major(semver.minVersion(babelVersion))
      : null;

    if (babelMajor) {
      await withProgress(
        `${
          babelMajor > 6
            ? 'Updaing babel configuration'
            : `Updating babel from v${babelMajor} to v7`
        } for package ${packageJson.name}`,
        async function () {
          const spinner = this;
          const spinnerText = spinner.text;

          const hasBabelRegister =
            babelPackages.has('babel-register') ||
            babelPackages.has('@babel/register');

          const hasBabelCli =
            babelPackages.has('babel-cli') || babelPackages.has('@babel/cli');

          const hasHotLoader = allDeps.has('react-hot-loader');

          const hasWebpack = allDeps.has('webpack');

          const packagesToInstall = babelPackagesToInstall.concat(
            [
              hasBabelCli && '@babel/cli',
              hasBabelRegister && '@babel/register',
              hasHotLoader && 'react-hot-loader@latest',
              hasWebpack && 'core-js@^3.12'
            ].filter(Boolean)
          );

          const packagesToUninstall = Array.from(babelPackages.keys());

          spinner.text = `${spinnerText}: uninstalling current babel and plugins`;

          await runInDir(
            `npm uninstall --save ${packagesToUninstall.join(' ')}`,
            location
          );

          spinner.text = `${spinnerText}: installing babel@7 and all required plugins`;

          await runInDir(
            `npm install --save-dev ${packagesToInstall.join(' ')}`,
            location
          );

          spinner.text = `${spinnerText}: replacing babel configuration`;

          try {
            await fs.unlink(babelRcPath);
          } catch (e) {
            // probably doesn't exists
          }

          const babelrc = `module.exports = (api) => {
  api.cache.using(() => process.env.NODE_ENV);

  return {
    presets: [
      ${
        hasWebpack
          ? `[
        require.resolve('@babel/preset-env'),
        {
          modules: api.env('test') ? 'commonjs' : false,
          useBuiltIns: 'usage',
          corejs: { version: '3.12', proposals: true }
        }
      ],`
          : "require.resolve('@babel/preset-env'),"
      }
      require.resolve('@babel/preset-react')
    ],
    plugins: [
      require.resolve('@babel/plugin-syntax-dynamic-import'),
      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }]${
        hasHotLoader
          ? `,
      // TODO: Replace with 'fast-refresh'
      // https://github.com/gaearon/react-hot-loader#moving-towards-next-step
      api.env('development') && require.resolve('react-hot-loader/babel')`
          : ''
      }
    ].filter(Boolean)
  };
}
`;

          await fs.writeFile(babelRcJsPath, babelrc, 'utf8');

          if (allDeps.has('electron')) {
            await fs.writeFile(browserslistRcPath, browserslistrc, 'utf8');
          }

          if (babelPackages.has('babel-register')) {
            spinner.text = `${spinnerText}: updating babel-register imports`;

            await replaceInFile({
              files: `${path.relative(process.cwd(), location)}/**/*.{js,ts}`,
              ignore: '**/node_modules/**',
              from: /\'babel-register\'/g,
              to: "'@babel/register'"
            });
          }
        }
      );
    }
  });
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

main();
