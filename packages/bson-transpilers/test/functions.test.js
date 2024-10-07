'use strict';
const bsonTranspilers = require('..');
const assert = require('assert');

const { BsonTranspilersUnimplementedError } = require('../helper/error');

describe('function expressions (shell)', function () {
  it('compiles functions to javascript', function () {
    assert.strictEqual(
      bsonTranspilers.shell.javascript.compile(
        'function(){ return this.x === 1 }'
      ),
      'function(){ return this.x === 1 }'
    );
  });

  it('compiles functions to javascript (takes the right source range)', function () {
    assert.strictEqual(
      bsonTranspilers.shell.javascript.compile(
        '1 + function(){ return this.x === 1 }'
      ),
      '1 + function(){ return this.x === 1 }'
    );
  });

  it('compiles functions to javascript (preserve new lines)', function () {
    assert.strictEqual(
      bsonTranspilers.shell.javascript.compile(`function(){
  return this.x === 1
}`),
      `function(){
  return this.x === 1
}`
    );
  });

  it('allows functions in pipeline stages', function () {
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

  ['object', 'csharp', 'java', 'python', 'ruby', 'rust', 'php'].forEach(
    (language) => {
      it(`throws an unsupported error compiling functions to ${language}`, function () {
        assert.throws(() => {
          bsonTranspilers.shell[language].compile('function(){}');
        }, new BsonTranspilersUnimplementedError('Support for exporting functions to languages other than javascript is not yet available.'));
      });
    }
  );
});
