const { readJSON, runTest } = require('./helpers');
const fs = require('fs');
const path = require('path');

const outputLanguages = ['csharp', 'python', 'java', 'javascript'];
const inputLanguages = ['javascript', 'shell'];

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
