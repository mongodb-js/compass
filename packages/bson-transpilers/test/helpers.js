const parse = require('fast-json-parse');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const compiler = require('../');

// Need a way to have test pass while developing
const outputLanguages = ['csharp', 'python', 'java', 'javascript'];
const inputLanguages = ['shell', 'javascript'];
const unsupported = {
  success: {
    javascript: {
      java: {},
      python: {},
      csharp: {
        'bson-methods': [ '*' ]
      }
    },
    shell: {
      java: {},
      javascript: {},
      python: {},
      csharp: {
        'bson-constructors': [ '*' ],
        'language-types': [ '*' ],
        'bson-methods': [ '*' ],
        'bson-utils': [ '*' ]
      }
    }
  },
  error: {
    javascript: {
      java: {'bson-constructors': [ '*' ]},
      python: { 'bson-constructors': [ '*' ]},
      csharp: {'bson-constructors': [ '*' ]}
    },
    shell: {
      java: {'bson-constructors': [ '*' ]},
      python: { 'bson-constructors': [ '*' ]},
      csharp: {'bson-constructors': [ '*' ]},
      javascript: {'bson-constructors': [ '*' ]}
    }
  }
};

const checkResults = {
  success: function(inputLang, outputLang, test) {
    expect(compiler[inputLang][outputLang].bind(this, test[inputLang])).to.not.throw();
    expect(compiler[inputLang][outputLang](test[inputLang])).to.equal(test[outputLang]);
  },

  error: function(inputLang, outputLang, test) {
    try {
      compiler[outputLang](test[inputLang]);
    } catch (error) {
      expect(error.code).to.equal(test.errorCode);
    }

    expect(compiler[inputLang][outputLang].bind(this, test[inputLang])).to.throw();
  }
};

const readJSON = (filename) => {
  const parseResult = parse(fs.readFileSync(filename));
  // if an error is returned from parsing json, just throw it
  if (parseResult.err) throw new Error(parseResult.err.message);
  return parseResult.value;
};

const runTest = function(mode, testname, inputLang, outputLang, tests) {
  if (inputLang === outputLang) {
    return;
  }
  describe(`${testname}:${inputLang} ==> ${outputLang}`, () => {
    Object.keys(tests).forEach((key) => {
      describe(key, () => {
        tests[key].map((test) => {
          const skip = (
            testname in unsupported[mode][inputLang][outputLang] &&
            (unsupported[mode][inputLang][outputLang][testname].indexOf('*') !== -1 ||
             unsupported[mode][inputLang][outputLang][testname].indexOf(key) !== -1)
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

module.exports = {inputLanguages, outputLanguages, readJSON, runTest};
