const bsonTranspilers = require('..');
const assert = require('assert');

const {
  BsonTranspilersUnimplementedError
} = require('../helper/error');

describe('function expressions (shell)', () => {
  it('compiles functions to javascript', () => {
    assert.strictEqual(
      bsonTranspilers.shell.javascript.compile('function(){}'),
      'function(){}'
    );
  });

  ['object', 'csharp', 'java', 'python'].forEach((language) => {
    it(`throws an unsupported error compiling functions to ${language}`, () => {
      assert.throws(
        () => {
          bsonTranspilers.shell[language].compile('function(){}');
        },
        new BsonTranspilersUnimplementedError(
          'Support for exporting functions to languages other than javascript is not yet available.'
        )
      );
    });
  });
});

