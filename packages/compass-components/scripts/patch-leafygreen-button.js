/**
 * We can't update @leafygreen-ui/button component to latest because it breaks
 * the types across the whole application, but we also have to add a dependency
 * on a new leafygreen package that depends on a new export from the button
 * package, this new export is a one-liner color value. As a temporary
 * workaround, we will patch leafygreen package and add the export manually. For
 * more details see https://github.com/mongodb-js/compass/pull/7223
 */
const fs = require('fs');
const path = require('path');

const leafygreenButtonPackage = path.dirname(
  require.resolve('@leafygreen-ui/button/package.json')
);

// eslint-disable-next-line no-console
console.log('Adding @leafygreen-ui/button/constants export...');

fs.writeFileSync(
  path.join(leafygreenButtonPackage, 'constants.js'),
  "module.exports = { PRIMARY_BUTTON_INTERACTIVE_GREEN: '#00593F' };"
);
fs.writeFileSync(
  path.join(leafygreenButtonPackage, 'constants.d.ts'),
  'export declare const PRIMARY_BUTTON_INTERACTIVE_GREEN = "#00593F";'
);
