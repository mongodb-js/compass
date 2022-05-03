const bsonTranspilers = require('..');
const assert = require('assert');

const {
  BsonTranspilersUnimplementedError
} = require('../helper/error');

describe('function expressions (shell)', () => {
  it('compiles functions to javascript', () => {
    assert.strictEqual(
      bsonTranspilers.shell.javascript.compile('function(){ return this.x === 1 }'),
      'function(){ return this.x === 1 }'
    );
  });

  it('compiles functions to javascript (takes the right source range)', () => {
    assert.strictEqual(
      bsonTranspilers.shell.javascript.compile('1 + function(){ return this.x === 1 }'),
      '1 + function(){ return this.x === 1 }'
    );
  });

  it('compiles functions to javascript (preserve new lines)', () => {
    assert.strictEqual(
      bsonTranspilers.shell.javascript.compile(`function(){
  return this.x === 1
}`),
      `function(){
  return this.x === 1
}`
    );
  });

  it('allows functions in pipeline stages', () => {
    assert.strictEqual(
      bsonTranspilers.shell.javascript.compile(`{
  $match: {
    x: function() { return true; }
  }
}`),
      `{
  '$match': {
    'x': function() { return true; }
  }
}`
    );
  });

  ['object', 'csharp', 'java', 'python', 'ruby', 'rust', 'swift'].forEach((language) => {
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

