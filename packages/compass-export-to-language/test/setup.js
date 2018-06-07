const Adapter = require('enzyme-adapter-react-16');
const chaiEnzyme = require('chai-enzyme');
const sinonChai = require('sinon-chai');
const enzyme = require('enzyme');
const chai = require('chai');

enzyme.configure({ adapter: new Adapter() });

require('jsdom-global')('', {
  beforeParse(win) {
    win.URL = {
      createObjectURL: () => {}
    };
  }
});

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

chai.should();
chai.use(sinonChai);
chai.use(chaiEnzyme());
