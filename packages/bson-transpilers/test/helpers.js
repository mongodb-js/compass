const parse = require('fast-json-parse');
const path = require('path');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const { toJava, toPython } = require('../');

const compile = {
  java: toJava,
  python: toPython
};

// Need a way to have test pass while developing
const unsupported = {
  java: [
    'RegExp', 'BsonRegExp', 'Decimal128',
    'Number', 'DateObject', 'Object'
  ],
  python: ['RegExp', 'BsonRegExp', 'DBRef', 'Decimal128', 'Timestamp']
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
