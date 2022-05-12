const { RuleTester } = require('eslint');
const path = require('path');
const rule = require('./no-leafygreen-outside-compass-components');

const ruleTester = new RuleTester();

const COMPASS_COMPONENTS = path.resolve('../../packages/compass-components');

ruleTester.run('no-leafygreen-outside-compass-components', rule, {
  valid: [
    {
      code: "const Foo = require('this-is-not-a-leafygreen-package');",
      parserOptions: { ecmaVersion: 2021 },
    },
    {
      code: "import Foo from 'this-is-not-a-leafygreen-package';",
      parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
    },
    {
      code: "import Foo from '@leafygreen-ui/foo-component';",
      parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
      options: [{ cwd: COMPASS_COMPONENTS }],
    },
  ],
  invalid: [
    {
      code: "const Foo = require('@leafygreen-ui/foo-component');",
      parserOptions: { ecmaVersion: 2021 },
      errors: [
        'Using @leafygreen-ui directly outside @mongodb-js/compass-component package is not allowed',
      ],
    },
    {
      code: "import Foo from '@leafygreen-ui/foo-component';",
      parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
      errors: [
        'Using @leafygreen-ui directly outside @mongodb-js/compass-component package is not allowed',
      ],
    },
  ],
});
