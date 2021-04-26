const setupTestBrowser = require('./setup-test-browser');
const browser = setupTestBrowser();

const webpackConfigTest = require('./webpack.config.test');

module.exports = (config) => {
  config.set({
    plugins: [
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-chrome-launcher',
      require('karma-webpack')
    ],
    webpack: webpackConfigTest,
    webpackMiddleware: {
      logLevel: 'silent'
    },
    frameworks: [
      'mocha'
    ],
    files: [
      {
        pattern: '../src/**/*.spec.ts'
      },
      {
        pattern: '../src/**/*.spec.tsx'
      }
    ],
    preprocessors: {
      '../src/**/*.spec.ts': [
        'webpack'
      ],
      '../src/**/*.spec.tsx': [
        'webpack'
      ]
    },
    reporters: [
      'mocha'
    ],
    customLaunchers: {
      HeadlessChrome: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },
    browsers: [ browser ],
    singleRun: true,
    client: {
      mocha: {
        timeout: 15000
      }
    }
  });
};
