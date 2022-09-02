/* eslint no-undef: "off" */
/* eslint-env node */
require('@babel/register')({
  root: require('path').resolve(__dirname, '..')
});

require('jsdom-global')();

const Enzyme = require('enzyme');
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17');
Enzyme.configure({ adapter: new Adapter() });

global.navigator = {
  userAgent: 'node.js'
};
