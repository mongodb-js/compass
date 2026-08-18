'use strict';
const assert = require('assert');
const transpilers = require('../index');

const SAMPLE = transpilers.shell.java;

const VALID_OPTIONS = {
  uri: 'mongodb://localhost',
  database: 'test',
  collection: 'webscale',
};

const INVALID_JS = '{ ... }';
const VALID_JS = '({ a : 1 })';

describe('bson transpiler', function () {
  describe('#compileWithDriver', function () {
    it('does not compile internal options like "options"', function () {
      const result = SAMPLE.compileWithDriver({
        options: VALID_OPTIONS,
        filter: VALID_JS,
      });
      assert.ok(result.includes('webscale'));
    });

    it('does not compile internal options like "exportMode"', function () {
      const result = SAMPLE.compileWithDriver({
        options: VALID_OPTIONS,
        exportMode: INVALID_JS,
        filter: VALID_JS,
      });
      assert.ok(result.includes('webscale'));
    });
  });

  describe('quoting of collection names', function () {
    // The delimiter each language's DriverTemplate wraps string literals in.
    const DELIMITERS = {
      python: "'",
      javascript: "'",
      ruby: "'",
      php: "'",
      java: '"',
      go: '"',
      rust: '"',
    };

    const NAMES = [
      "a'b]c",
      'a"b]c',
      'a\\', // trailing backslash
      'a\\nb', // backslash followed by "n", not a newline
      "'abc'", // name that is itself quoted
      '"abc"',
      "'", // a lone quote
      'a\nb', // an actual newline
    ];

    // Ruby and PHP single-quoted strings do not interpret \n, but do allow a
    // literal newline, so newlines are left as-is for those two.
    const LITERAL_NEWLINE = { ruby: true, php: true };

    const expectedLiteral = (name, quote, lang) => {
      const body = name
        .split('')
        .map((c) => {
          if (c === '\\' || c === quote) return '\\' + c;
          if (LITERAL_NEWLINE[lang]) return c;
          if (c === '\n') return '\\n';
          if (c === '\r') return '\\r';
          return c;
        })
        .join('');
      return quote + body + quote;
    };

    Object.keys(DELIMITERS).forEach(function (lang) {
      const quote = DELIMITERS[lang];

      NAMES.forEach(function (name) {
        it(`${lang}: quotes ${JSON.stringify(name)}`, function () {
          const result = transpilers.shell[lang].compileWithDriver({
            aggregation: '[{$match: {x: 1}}]',
            options: {
              uri: 'mongodb://localhost',
              database: 'test',
              collection: name,
            },
            exportMode: 'Query',
          });

          const expected = expectedLiteral(name, quote, lang);
          assert.ok(
            result.includes(expected),
            `expected literal ${expected} in:\n${result}`
          );
        });
      });
    });

    it('python quotes a single quote in a pipeline string', function () {
      const result = transpilers.shell.python.compile(
        `[{$match: {name: "a'b"}}]`,
        false
      );
      assert.ok(
        result.includes("'a\\'b'"),
        `expected an escaped single quote, got:\n${result}`
      );
    });
  });
});
