const { readJSON, runTest } = require('./helpers');

const languages = ['java', 'python', 'csharp'];
const inputLang = 'query';

describe('BSONConstructors', () => {
  const file = 'bson-constructors';
  const tests = readJSON(`./${file}.json`).tests;
  languages.forEach((outputLang) => {
    runTest(file, inputLang, outputLang, tests);
  });
});

describe('Built-in Object Constructors', () => {
  const file = 'built-in-types';
  const tests = readJSON(`./${file}.json`).tests;
  languages.forEach((outputLang) => {
    runTest(file, inputLang, outputLang, tests);
  });
});

describe('BSONObjectMethods', () => {
  const file = 'bson-object-methods';
  const tests = readJSON(`./${file}.json`).tests;
  languages.forEach((outputLang) => {
    runTest(file, inputLang, outputLang, tests);
  });
});

describe('BSONUtils', () => {
  const file = 'bson-utils';
  const tests = readJSON(`./${file}.json`).tests;
  languages.forEach((outputLang) => {
    runTest(file, inputLang, outputLang, tests);
  });
});

