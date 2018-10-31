/* eslint no-sync: 0 */
const path = require('path');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;
const yaml = require('js-yaml');

const transpiler = require('../index');

const outputLanguages = process.env.OUTPUT ? process.env.OUTPUT.split(',') : [ 'csharp', 'python', 'java', 'javascript', 'shell'];
const inputLanguages = process.env.INPUT ? process.env.INPUT.split(',') : [ 'shell', 'javascript', 'python' ];
const modes = process.env.MODE ? process.env.MODE.split(',') : [];

const skipType = [];

const readYAML = (filename) => {
  let parseResult;
  try {
    parseResult = yaml.load(fs.readFileSync(filename));
  } catch (err) {
    err.message = `${filename}: ${err.message}`;
    throw err;
  }
  return parseResult;
};

const testpath = path.join(__dirname, 'yaml');
fs.readdirSync(testpath).map((file) => {
  if (file === 'edge-cases') {
    return; // Ignore edge case tests, they have their own runners
  }
  const mode = file.replace('.yaml', '');
  if (modes.length > 0 && modes.indexOf(mode) === -1) {
    return;
  }
  describe(mode, () => {
    const tests = readYAML(path.join(testpath, file));
    for (const type of Object.keys(tests.tests)) {
      if (skipType.indexOf(type) !== -1) {
        continue;
      }
      describe(`${type}`, () => {
        for (const test of tests.tests[type]) {
          const description = test.description
            ? (d) => {
              describe(`${test.description}`, () => (d()));
            }
            : (d) => (d());
          description(() => {
            for (const input of Object.keys(test.input)) {
              if (inputLanguages.indexOf(input) === -1) {
                continue;
              }
              const outputLang = test.output ? Object.keys(test.output) : outputLanguages;
              for (const output of outputLang) {
                if (outputLanguages.indexOf(output) === -1) {
                  continue;
                }
                if (input !== output) {
                  tests.runner(it, expect, input, output, transpiler, test);
                }
              }
            }
          });
        }
      });
    }
  });
});
