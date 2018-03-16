const parse = require('fast-json-parse');
const path = require('path');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const Python3Generator = require('../codegeneration/Python3Generator.js');
const JavaGenerator = require('../codegeneration/JavaGenerator.js');
const compileECMAScript = require('../');

const generators = {
  java: new JavaGenerator(),
  python: new Python3Generator()
};

// Need a way to have test pass while developing
const unsupported = {
  java: ['RegExp', 'BsonRegExp', 'Decimal128', 'Timestamp'],
  python: ['RegExp', 'BsonRegExp', 'DBRef', 'Decimal128', 'Timestamp', 'Symbol']
};

const readJSON = (filename) => {
  const parseResult = parse(fs.readFileSync(path.join(__dirname, filename)));
  // if an error is returned from parsing json, just throw it
  if (parseResult.err) throw new Error(parseResult.err.message);
  return parseResult.value;
};

const runTest = (inputLang, outputLang, tests, generator) => {
  describe(`${inputLang} ==> ${outputLang}`, () => {
    Object.keys(tests).forEach((key) => {
      describe(key, () => {
        tests[key].map((test) => {
          const skip = unsupported[outputLang].indexOf(key) !== -1;
          (skip ? xit : it)(test.description, () => {
            expect(compileECMAScript(test[inputLang], generator)).to.equal(test[outputLang]);
          });
        });
      });
    });
  });
};

module.exports = {
  generators: generators,
  readJSON: readJSON,
  runTest: runTest
};
