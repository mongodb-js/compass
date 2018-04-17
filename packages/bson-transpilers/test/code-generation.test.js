const { readJSON, runTest } = require('./helpers');
const fs = require('fs');
const path = require('path');

const outputLanguages = ['java', 'python', 'csharp'];
const inputLanguages = ['javascript'];

describe('Test', () => {
  const pSuccess = path.join(__dirname, 'json', 'success');
  const pError = path.join(__dirname, 'json', 'error');

  const filesSuccess = fs.readdirSync(pSuccess);
  const filesError = fs.readdirSync(pError);

  filesSuccess.map((file) => {
    const tests = readJSON(path.join(pSuccess, file)).tests;
    const testname = file.replace('.json', '');

    inputLanguages.forEach((inputLang) => {
      outputLanguages.forEach((outputLang) => {
        runTest('success', testname, inputLang, outputLang, tests);
      });
    });
  });

  filesError.map((file) => {
    const tests = readJSON(path.join(pError, file)).tests;
    const testname = file.replace('.json', '');

    inputLanguages.forEach((inputLang) => {
      outputLanguages.forEach((outputLang) => {
        runTest('error', testname, inputLang, outputLang, tests);
      });
    });
  });
});
