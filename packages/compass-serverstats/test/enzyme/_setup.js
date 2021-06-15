/**
 * Creates a headless browser environment with jsdom for server-side testing.
 */
const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const jsdom = require('jsdom');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.sendTo(console, { omitJSDOMErrors: true });

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

require('jsdom-global')('', {
  virtualConsole: virtualConsole,
  beforeParse(win) {
    win.URL = {
      createObjectURL: () => {}
    };
  },
  runScripts: 'dangerously'
});

global.navigator = {
  userAgent: 'node.js'
};
