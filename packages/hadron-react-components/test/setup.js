/* eslint no-undef: "off" */
/* eslint-env node */
require('@babel/register')({
  root: require('path').resolve(__dirname, '..')
});

require('jsdom-global')();

const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
Enzyme.configure({ adapter: new Adapter() });

global.navigator = {
  userAgent: 'node.js'
};
