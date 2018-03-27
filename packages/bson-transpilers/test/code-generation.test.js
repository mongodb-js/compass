const { readJSON, runTest } = require('./helpers');
const fs = require('fs');
const path = require('path');

const languages = ['java', 'python', 'csharp'];
const inputLang = 'query';

describe('Test', () => {
  const p = path.join(__dirname, 'json');
  const files = fs.readdirSync(p);
  files.map((file) => {
    const tests = readJSON(path.join(p, file)).tests;
    const testname = file.replace('.json', '');
    languages.forEach((outputLang) => {
      runTest(testname, inputLang, outputLang, tests);
    });
  });
});

