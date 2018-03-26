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
  java: {
    'bson-constructors': ['Decimal128'],
    'built-in-types': [ '*' ],
    'bson-object-methods': [ 'DBRef', 'Double', 'Long', 'In32', 'MinKey', 'MaxKey', 'BSONRegExp', 'Timestamp', 'Symbol', 'Decimal128'],
    'bson-utils': [ '*' ]
  },
  python: {
    'bson-constructors': [ '*' ],
    'built-in-types': [ '*' ],
    'bson-object-methods': [ '*' ],
    'bson-utils': [ '*' ]
  },
  csharp: {
    'bson-constructors': [ '*' ],
    'built-in-types': [ '*' ],
    'bson-object-methods': [ '*' ],
    'bson-utils': [ '*' ]
  }
};

const readJSON = (filename) => {
  const parseResult = parse(fs.readFileSync(path.join(__dirname, filename)));
  // if an error is returned from parsing json, just throw it
  if (parseResult.err) throw new Error(parseResult.err.message);
  return parseResult.value;
};

const runTest = (testname, inputLang, outputLang, tests) => {
  describe(`${inputLang} ==> ${outputLang}`, () => {
    Object.keys(tests).forEach((key) => {
      describe(key, () => {
        tests[key].map((test) => {
          const skip = unsupported[outputLang][testname].indexOf('*') !== -1 || unsupported[outputLang][testname].indexOf(key) !== -1;
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
