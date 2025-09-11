'use strict';
const { RuleTester } = require('eslint');
const rule = require('./no-inline-emotion-css');

const ruleTester = new RuleTester();

ruleTester.run('no-leafygreen-outside-compass-components', rule, {
  valid: [
    {
      code: "const staticSet = css({ background: 'orange' });",
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: `
const pineappleStyles = css({ background: 'purple' });
function pineapple() { return pineappleStyles; };`,
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: `
const pineappleStyles = css({ background: 'purple' });
function pineapple() { return (<div className={pineappleStyles}>pineapples</div>); }`,
      parserOptions: { ecmaVersion: 2021, ecmaFeatures: { jsx: true } },
    },
  ],
  invalid: [
    {
      code: "function pineapple() { const dynamicSet = css({ background: 'orange' }); }",
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        "Don't use a dynamic css() call in the render method, this creates a new class name every time component updates and is not performant. Static styles can be defined with css outside of render, dynamic should be passed through the style prop.",
      ],
    },
    {
      code: "function pineapple() { return (<div className={css({ background: 'purple' })}>pineapples</div>); }",
      parserOptions: { ecmaVersion: 2021, ecmaFeatures: { jsx: true } },

      errors: [
        "Don't use a dynamic css() call in the render method, this creates a new class name every time component updates and is not performant. Static styles can be defined with css outside of render, dynamic should be passed through the style prop.",
      ],
    },
  ],
});
