const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
Enzyme.configure({ adapter: new Adapter() });

const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const sinonChai = require('sinon-chai');
const hadronApp = require('hadron-app');
const AppRegistry = require('hadron-app-registry');

require('jsdom-global')('', {
  beforeParse(win) {
    win.URL = {
      createObjectURL: () => {}
    };
  }
});
const appRegistry = new AppRegistry();

global.sinon = require('sinon');
global.expect = chai.expect;
global.hadronApp = hadronApp;
global.hadronApp.appRegistry = appRegistry;

appRegistry.onActivated();

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
