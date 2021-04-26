const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

Enzyme.configure({ adapter: new Adapter() });

const AppRegistry = require('hadron-app-registry');
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const sinonChai = require('sinon-chai');
const jsdom = require('jsdom');
const virtualConsole = new jsdom.VirtualConsole();

virtualConsole.sendTo(console, { omitJSDOMErrors: true });

require('jsdom-global')('', {
  virtualConsole,
  beforeParse(win) {
    win.URL = { createObjectURL: () => {} };
  },
  runScripts: 'dangerously'
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
