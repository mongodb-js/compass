const webpackConfig = require('./config/webpack.karma.config');

module.exports = function(config) {
  config.set({
    basePath: '',
    singleRun: true,
    files: [
      'test/**/*.spec.js'
    ],
    reporters: ['mocha', 'junit'],
    preprocessors: {
      'test/**/*.spec.js': ['webpack', 'sourcemap']
    },
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
    },
    junitReporter: {
      outputDir: 'coverage', // results will be saved as $outputDir/$browserName.xml
      outputFile: 'karma-results.xml', // if included, results will be saved as $outputDir/$browserName/$outputFile
      useBrowserName: false, // add browser name to report and classes names
      // the default configuration
      suite: '', // suite will become the package name attribute in xml testsuite element
      nameFormatter: undefined, // function (browser, result) to customize the name attribute in xml testcase element
      classNameFormatter: undefined, // function (browser, result) to customize the classname attribute in xml testcase element
      properties: {}, // key value pair of properties to add to the <properties> section of the report
      xmlVersion: null // use '1' if reporting to be per SonarQube 6.2 XML format
    }
  });
};
