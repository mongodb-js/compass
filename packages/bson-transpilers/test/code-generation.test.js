/* eslint no-sync: 0 */
const { readJSON, runTest } = require('./helpers');
const path = require('path');
const fs = require('fs');

const outputLanguages = process.env.OUTPUT ? process.env.OUTPUT.split(',') : [ 'csharp', 'python', 'java', 'javascript', 'shell'];
const inputLanguages = process.env.INPUT ? process.env.INPUT.split(',') : [ 'shell', 'javascript' ];
const modes = process.env.MODE ? process.env.MODE.split(',') : ['success', 'error'];

describe('Test', () => {
  modes.forEach((mode) => {
    const testpath = path.join(__dirname, 'json', mode);
    inputLanguages.forEach((inputLang) => {
      fs.readdirSync(path.join(testpath, inputLang)).map((file) => {
        const tests = readJSON(path.join(testpath, inputLang, file)).tests;
        const testname = file.replace('.json', '');

        outputLanguages.forEach((outputLang) => {
          runTest(mode, testname, inputLang, outputLang, tests);
        });
      });
    });
  });
});
