const Enzyme = require('enzyme');
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17');
Enzyme.configure({ adapter: new Adapter() });

const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const sinonChai = require('sinon-chai');

require('jsdom-global')('');

global.sinon = require('sinon');
global.expect = chai.expect;

class Worker {
  postMessage() {
    return true;
  }
  terminate() {
    return true;
  }
}

global.Worker = Worker;

// https://github.com/jsdom/jsdom/issues/1721
global.window.URL.createObjectURL = function() {};

// https://github.com/jsdom/jsdom/issues/1695
global.window.HTMLElement.prototype.scrollIntoView = function() {};

chai.should();
chai.use(sinonChai);
chai.use(chaiEnzyme());
