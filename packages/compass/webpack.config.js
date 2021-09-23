// @ts-check
const path = require('path');
const {
  createElectronMainConfig,
  createElectronRendererConfig
} = require('@mongodb-js/webpack-config-compass');

module.exports = (_env, args) => {
  return [
    createElectronMainConfig({
      ...args,
      entry: path.resolve(__dirname, 'src', 'main.js'),
      outputPath: path.resolve(__dirname, 'build'),
      outputFilename: 'main.js'
    }),
    createElectronRendererConfig({
      ...args,
      entry: [
        path.resolve(__dirname, 'src', 'app', 'index.js'),
        path.resolve(__dirname, 'src', 'app', 'loading', 'loading.js')
      ],
      outputPath: path.resolve(__dirname, 'build')
    })
  ];
};
