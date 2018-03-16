const { generators, readJSON, runTest } = require('./helpers');

const languages = ['java', 'python'];
const inputLang = 'query';

describe('BSONConstructors', () => {
  const tests = readJSON('./bson-constructors.json').bsonTypes;
  languages.forEach((outputLang) => {
    runTest(inputLang, outputLang, tests, generators[outputLang]);
  });
});

describe('Built-in Object Constructors', () => {
  const tests = readJSON('./built-in-types.json').types;
  languages.forEach((outputLang) => {
    runTest(inputLang, outputLang, tests, generators[outputLang]);
  });
});


