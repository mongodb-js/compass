const { RuleTester } = require('eslint');

const ruleTester = new RuleTester();
const rule = require('./no-mongodb-link-without-utm-params');

ruleTester.run('no-mongodb-link-without-utm-params', rule, {
  valid: [
    {
      code: "const url = 'https://anything.com';",
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: "const url = 'https://mongodb.org?utm_source=compass&utm_medium=product';",
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: "const url = 'https://mongodb.com?utm_source=compass&utm_medium=product';",
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: "const url = 'https://mongodb.com/docs/?utm_source=compass&utm_medium=product';",
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: "const url = 'https://docs.mongodb.com/?utm_source=compass&utm_medium=product';",
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: "const url = 'https://feedback.mongodb.com/?utm_source=compass&utm_medium=product';",
      parserOptions: { ecmaVersion: 2021 },
    },
  ],
  invalid: [
    {
      code: "const url = 'https://mongodb.com/docs/compass';",
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        {
          message:
            'URL does not contain utm_source=compass, utm_medium=product',
          suggestions: [
            {
              desc: 'Add utm_source=compass, utm_medium=product',
              output:
                "const url = 'https://mongodb.com/docs/compass?utm_source=compass&utm_medium=product';",
            },
          ],
        },
      ],
    },
    {
      code: "const url = 'https://docs.mongodb.com/compass/?utm_medium=product';",
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        {
          message: 'URL does not contain utm_source=compass',
          suggestions: [
            {
              desc: 'Add utm_source=compass',
              output:
                "const url = 'https://docs.mongodb.com/compass/?utm_medium=product&utm_source=compass';",
            },
          ],
        },
      ],
    },
  ],
});
