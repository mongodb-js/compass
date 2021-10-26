const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
Enzyme.configure({ adapter: new Adapter() });

const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

require('jsdom-global')();

window.Object = Object;
window.Math = Math;

global.sinon = require('sinon');
global.expect = chai.expect;

chai.should();
chai.use(sinonChai);
chai.use(chaiEnzyme());
chai.use(chaiAsPromised);

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
