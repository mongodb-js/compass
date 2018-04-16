const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const sinonChai = require('sinon-chai');

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
