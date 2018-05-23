/* eslint no-sync: 0 */
const { readJSON, runTest } = require('./helpers');
const path = require('path');
const fs = require('fs');

const outputLanguages = process.env.OUTPUT ? process.env.OUTPUT.split(',') : [ 'csharp', 'python', 'java', 'javascript', 'shell'];
const inputLanguages = process.env.INPUT ? process.env.INPUT.split(',') : [ 'shell', 'javascript' ];

describe('Test', () => {
  const pSuccess = path.join(__dirname, 'json', 'success');
  const pError = path.join(__dirname, 'json', 'error');

  inputLanguages.forEach((inputLang) => {
    fs.readdirSync(path.join(pSuccess, inputLang)).map((file) => {
      const tests = readJSON(path.join(pSuccess, inputLang, file)).tests;
      const testname = file.replace('.json', '');

      outputLanguages.forEach((outputLang) => {
        runTest('success', testname, inputLang, outputLang, tests);
      });
    });
  });

  inputLanguages.forEach((inputLang) => {
    fs.readdirSync(path.join(pError, inputLang)).map((file) => {
      const tests = readJSON(path.join(pError, inputLang, file)).tests;
      const testname = file.replace('.json', '');

      outputLanguages.forEach((outputLang) => {
        runTest('error', testname, inputLang, outputLang, tests);
      });
    });
  });
});
