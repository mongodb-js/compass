const webpackConfig = require('./config/webpack.karma.config');

module.exports = (config) => {
  config.set({
    basePath: '',
    singleRun: true,
    files: ['test/karma-setup.js'],
    reporters: ['mocha'],
    preprocessors: { 'test/karma-setup.js': ['webpack', 'sourcemap', 'electron'] },
    browsers: ['Compass'],
    frameworks: ['mocha', 'chai', 'sinon', 'chai-sinon'],
    webpack: webpackConfig,
    webpackMiddleware: { noInfo: true, stats: 'errors-only' },
    // DEV: `useIframe: false` is for launching a new window instead of using an iframe
    // In Electron, iframes don't get `nodeIntegration` priveleges yet windows do.
    client: { useIframe: false },
    logLevel: config.LOG_ERROR,
    /**
     * Define a custom launcher which inherits from `Electron`
     * @see https://github.com/mongodb-js/compass-connect/pull/82
     * @see https://github.com/twolfson/karma-electron#forcing-nodeintegration-support
     */
    customLaunchers: {
      Compass: {
        base: 'Electron',
        browserWindowOptions: {
          webPreferences: {
            nodeIntegration: true
          }
        }
      }
    }
  });
};
