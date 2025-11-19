'use strict';
const { RuleTester } = require('eslint');
const rule = require('./no-expect-throw-without-call');

const ruleTester = new RuleTester();

ruleTester.run('no-expect-throw-without-call', rule, {
  valid: [
    {
      code: 'expect(() => someFn()).to.throw()',
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: "expect(() => { throw new Error('test'); }).to.throw()",
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: "expect(function() { throw new Error('test'); }).to.throw()",
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: 'expect(() => someFn()).to.throw(Error)',
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: "expect(() => someFn()).to.throw('error message')",
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: 'expect(() => someFn()).to.throw(/error/)',
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: `
it('should test something', () => {
  expect(() => dangerousFunction()).to.throw();
});`,
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: 'const result = expect(() => fn()).to.throw()',
      parserOptions: { ecmaVersion: 2021 },
    },
    // Valid - not using expect().to.throw.
    {
      code: 'expect(value).to.equal(5)',
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: 'expect(promise).to.be.rejectedWith(Error)',
      parserOptions: { ecmaVersion: 2021 },
    },
  ],
  invalid: [
    {
      code: 'expect(() => someFn()).to.throw',
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        {
          messageId: 'throwNotInvoked',
        },
      ],
    },
    {
      code: 'expect(function() { throw new Error(); }).to.throw',
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        {
          messageId: 'throwNotInvoked',
        },
      ],
    },
    {
      code: `
it('should test something', () => {
  expect(() => dangerousFunction()).to.throw;
});`,
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        {
          messageId: 'throwNotInvoked',
        },
      ],
    },
    {
      code: 'const result = expect(() => fn()).to.throw',
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        {
          messageId: 'throwNotInvoked',
        },
      ],
    },
    {
      code: 'expect(async () => someFn()).to.throw()',
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        {
          messageId: 'asyncFunction',
        },
      ],
    },
    {
      code: 'expect(async function() { throw new Error(); }).to.throw()',
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        {
          messageId: 'asyncFunction',
        },
      ],
    },
    {
      code: `
it('should test async', async () => {
  expect(async () => await asyncFn()).to.throw();
});`,
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        {
          messageId: 'asyncFunction',
        },
      ],
    },
    {
      code: 'expect(() => Promise.reject(new Error())).to.throw()',
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        {
          messageId: 'asyncFunction',
        },
      ],
    },
    // Multiple errors - not invoked and async.
    {
      code: 'expect(async () => someFn()).to.throw',
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        {
          messageId: 'throwNotInvoked',
        },
      ],
    },
  ],
});
