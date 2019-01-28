const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const AppRegistry = require('hadron-app-registry');
const app = require('hadron-app');
Enzyme.configure({ adapter: new Adapter() });

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
global.hadronApp = app;
global.hadronApp.appRegistry = new AppRegistry();

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
