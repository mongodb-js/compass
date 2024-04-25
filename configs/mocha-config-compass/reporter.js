'use strict';
const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');

// Import the built-in reporters
const Spec = Mocha.reporters.Spec;
const XUnit = Mocha.reporters.XUnit;

class Reporter {
  constructor(runner) {
    const suiteName = path.basename(process.cwd());

    new Spec(runner);

    runner.on('suite', (suite) => {
      if (suite.parent?.root) {
        suite.title = `${suiteName}__${suite.title}`;
      }
    });

    new XUnit(runner, {
      reporterOptions: {
        suiteName,
        output: path.join(__dirname, '..', '..', '.logs', `${suiteName}.xml`),
      },
    });
  }
}

module.exports = Reporter;
