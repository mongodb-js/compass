/**
 * Creates a headless browser environment with jsdom for server-side testing.
 */
const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
Enzyme.configure({ adapter: new Adapter() });

const root = require('path').resolve(__dirname, '..', '..');

require('@babel/register')({
  root,
  only: [
    // To work around https://github.com/babel/babel/issues/10232#issuecomment-678429724
    (filepath) => {
      return String(filepath).startsWith(root);
    }
  ],
  // Adding custom `only` requires manually provide a custom `ignore` (even
  // though it matches the default one)
  ignore: [/node_modules/]
});

const jsdom = require('jsdom').jsdom;
const exposedProperties = ['window', 'navigator', 'document'];

global.document = jsdom('');
global.window = document.defaultView;
Object.keys(document.defaultView).forEach((property) => {
  if (typeof global[property] === 'undefined') {
    exposedProperties.push(property);
    global[property] = document.defaultView[property];
  }
});

global.navigator = {
  userAgent: 'node.js'
};
