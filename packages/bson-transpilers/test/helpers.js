const parse = require('fast-json-parse');
const path = require('path');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const { toJava, toPython, toCSharp } = require('../');

const compile = {
  java: toJava,
  python: toPython,
  csharp: toCSharp
};

// Need a way to have test pass while developing
const unsupported = {
  java: ['Decimal128'],
  python: [
    'RegExp', 'BSONRegExp', 'DBRef', 'Decimal128', 'Timestamp', 'literals',
    'ArrayElision'
  ],
  csharp: [
    'RegExp', 'DBRef', 'Decimal128', 'Document', 'Array', 'ArrayElision', 'Symbol', 'Date', 'DateNow', 'RegExp'
  ]
};

const readJSON = (filename) => {
  const parseResult = parse(fs.readFileSync(path.join(__dirname, filename)));
  // if an error is returned from parsing json, just throw it
  if (parseResult.err) throw new Error(parseResult.err.message);
  return parseResult.value;
};

const runTest = (inputLang, outputLang, tests) => {
  describe(`${inputLang} ==> ${outputLang}`, () => {
    Object.keys(tests).forEach((key) => {
      describe(key, () => {
        tests[key].map((test) => {
          const skip = unsupported[outputLang].indexOf(key) !== -1;
          (skip ? xit : it)(test.description, () => {
            expect(compile[outputLang](test[inputLang])).to.equal(test[outputLang]);
          });
        });
      });
    });
  });
};

module.exports = {
  readJSON: readJSON,
  runTest: runTest
};
