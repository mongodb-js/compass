const Adapter = require('@wojtekmaj/enzyme-adapter-react-17');
const chaiEnzyme = require('chai-enzyme');
const sinonChai = require('sinon-chai');
const enzyme = require('enzyme');
const chai = require('chai');

enzyme.configure({ adapter: new Adapter() });

// virtualConsole.sendTo(console, { omitJSDOMErrors: true });
require('jsdom-global')('', {
  // virtualConsole: virtualConsole,
  beforeParse(win) {
    win.URL = {
      createObjectURL: () => {}
    };
  },
  runScripts: 'dangerously'
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
