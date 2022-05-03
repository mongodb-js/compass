/* eslint no-sync: 0 */
const path = require('path');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;
const yaml = require('js-yaml');
const Context = require('context-eval');
const bson = require('bson');

const transpiler = require('../index');

const outputLanguages = process.env.OUTPUT ? process.env.OUTPUT.split(',') : [ 'csharp', 'python', 'java', 'javascript', 'shell', 'object', 'ruby', 'rust', 'swift'];
const inputLanguages = process.env.INPUT ? process.env.INPUT.split(',') : [ 'shell', 'javascript', 'python' ];
const modes = process.env.MODE ? process.env.MODE.split(',') : [];

const skipType = [];

const readYAML = (filename) => {
  let parseResult;
  try {
    parseResult = yaml.load(fs.readFileSync(filename));
  } catch (err) {
    err.message = `${filename}: ${err.message}`;
    throw err;
  }
  return parseResult;
};

const executeJavascript = (input) => {
  const sandbox = {
    RegExp: RegExp,
    BSONRegExp: bson.BSONRegExp,
    // Binary: bson.Binary,
    DBRef: bson.DBRef,
    Decimal128: bson.Decimal128,
    Double: bson.Double,
    Int32: bson.Int32,
    Long: bson.Long,
    Int64: bson.Long,
    Map: bson.Map,
    MaxKey: bson.MaxKey,
    MinKey: bson.MinKey,
    ObjectID: bson.ObjectID,
    ObjectId: bson.ObjectID,
    BSONSymbol: bson.BSONSymbol,
    Timestamp: bson.Timestamp,
    Code: function(c, s) {
      return new bson.Code(c, s);
    },
    Date: function(s) {
      const args = Array.from(arguments);

      if (args.length === 1) {
        return new Date(s);
      }

      return new Date(Date.UTC(...args));
    },
    Buffer: Buffer,
    __result: {}
  };
  const ctx = new Context(sandbox);
  const res = ctx.evaluate('__result = ' + input);
  ctx.destroy();
  return res;
};

const testpath = path.join(__dirname, 'yaml');
fs.readdirSync(testpath).map((file) => {
  if (file === 'edge-cases') {
    return; // Ignore edge case tests, they have their own runners
  }
  const mode = file.replace('.yaml', '');
  if (modes.length > 0 && modes.indexOf(mode) === -1) {
    return;
  }
  describe(mode, () => {
    const tests = readYAML(path.join(testpath, file));
    for (const type of Object.keys(tests.tests)) {
      if (skipType.indexOf(type) !== -1) {
        continue;
      }
      describe(`${type}`, () => {
        for (const test of tests.tests[type]) {
          const description = test.description
            ? (d) => {
              describe(`${test.description}`, () => (d()));
            }
            : (d) => (d());
          description(() => {
            for (const input of Object.keys(test.input)) {
              if (inputLanguages.indexOf(input) === -1) {
                continue;
              }
              const outputLang = test.output ? Object.keys(test.output) : outputLanguages;
              for (const output of outputLang) {
                if (outputLanguages.indexOf(output) === -1) {
                  continue;
                }
                if (test.output && output === 'object') { // Can't import libraries from YAML, so un-stringify it first
                  it(`${input}: ${test.input[input]} => runnable object`, () => {
                    const expected = executeJavascript(test.output.object);
                    const actual = transpiler[input].object.compile(test.input[input]);
                    if (expected && typeof expected === 'object' && '_bsontype' in expected) {
                      expect(actual._bsontype).to.equal(expected._bsontype);
                      expect(actual.value).to.equal(expected.value);
                    } else if (test.description && test.description.includes('now date')) {
                      expect(actual instanceof Date).to.equal(true);
                    } else if (test.description && test.description.includes('date.now')) {
                      expect(typeof actual).to.equal('number');
                    } else {
                      expect(actual).to.deep.equal(expected);
                    }
                  });
                } else if (input !== output) {
                  tests.runner(it, expect, input, output, transpiler, test);
                }
              }
            }
          });
        }
      });
    }
  });
});
