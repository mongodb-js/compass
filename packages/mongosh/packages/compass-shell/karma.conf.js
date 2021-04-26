const webpackConfig = require('./config/webpack.karma.config');

module.exports = (config) => {
  config.set({
    basePath: '',
    singleRun: true,
    files: ['test/karma-setup.js'],
    reporters: ['mocha'],
    preprocessors: { 'test/karma-setup.js': ['webpack', 'sourcemap'] },
    browsers: ['Electron'],
    frameworks: ['mocha', 'chai', 'sinon', 'chai-sinon'],
    webpack: webpackConfig,
    webpackMiddleware: { noInfo: true, stats: 'errors-only' },
    // DEV: `useIframe: false` is for launching a new window instead of using an iframe
    // In Electron, iframes don't get `nodeIntegration` priveleges yet windows do.
    client: {
      useIframe: false,
      mocha: {
        timeout: 15000
      }
    },
    logLevel: config.LOG_ERROR
  });
};
