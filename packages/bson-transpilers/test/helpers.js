const parse = require('fast-json-parse');
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
  success: {
    java: {},
    python: {
      'bson-constructors': [ '*' ],
      'js-constructors': [ '*' ],
      'bson-object-methods': [ '*' ],
      'bson-utils': [ '*' ],
      'js-utils': [ '*' ]
    },
    csharp: {
      'bson-constructors': [ '*' ],
      'js-constructors': [ '*' ],
      'bson-object-methods': [ '*' ],
      'bson-utils': [ '*' ],
      'js-utils': [ '*' ]
    }
  },
  error: {
    java: {'bson-constructors': [ '*' ]},
    python: {},
    csharp: {'bson-constructors': [ '*' ]}
  }
};

const checkResults = {
  success: function(inputLang, outputLang, test) {
    expect(compile[outputLang].bind(this, test[inputLang])).to.not.throw();
    expect(compile[outputLang](test[inputLang])).to.equal(test[outputLang]);
  },

  error: function(inputLang, outputLang, test) {
    try {
      compile[outputLang](test[inputLang]);
    } catch (error) {
      expect(error.code).to.equal(test.errorCode);
    }

    expect(compile[outputLang].bind(this, test[inputLang])).to.throw();
  }
};

const readJSON = (filename) => {
  const parseResult = parse(fs.readFileSync(filename));
  // if an error is returned from parsing json, just throw it
  if (parseResult.err) throw new Error(parseResult.err.message);
  return parseResult.value;
};

const runTest = function(mode, testname, inputLang, outputLang, tests) {
  describe(`${testname}:${inputLang} ==> ${outputLang}`, () => {
    Object.keys(tests).forEach((key) => {
      describe(key, () => {
        tests[key].map((test) => {
          const skip = (
            testname in unsupported[mode][outputLang] &&
            (unsupported[mode][outputLang][testname].indexOf('*') !== -1 ||
             unsupported[mode][outputLang][testname].indexOf(key) !== -1)
          );

          (skip ? xit : it)(
            test.description,
            () => checkResults[mode](inputLang, outputLang, test)
          );
        });
      });
    });
  });
};

module.exports = {
  readJSON: readJSON,
  runTest: runTest
};
