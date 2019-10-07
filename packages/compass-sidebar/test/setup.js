const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

Enzyme.configure({ adapter: new Adapter() });

const AppRegistry = require('hadron-app-registry');
const hadronApp = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const sinonChai = require('sinon-chai');
const jsdom = require('jsdom');
const virtualConsole = new jsdom.VirtualConsole();

virtualConsole.sendTo(console, { omitJSDOMErrors: true });

require('jsdom-global')('', {
  virtualConsole,
  beforeParse(win) {
    win.URL = {
      createObjectURL: () => {}
    };
  },
  runScripts: 'dangerously'
});

const WriteStateStore = require('../electron/renderer/stores/deployment-state-store');
const NamespaceStore = require('../electron/renderer/stores/namespace-store');
const CollectionStore = require('../electron/renderer/stores/collection-store');
const appRegistry = new AppRegistry();

global.sinon = require('sinon');
global.expect = chai.expect;
global.hadronApp = hadronApp;
global.hadronApp.appRegistry = new AppRegistry();

appRegistry.registerStore('DeploymentAwareness.WriteStateStore', WriteStateStore);
appRegistry.registerStore('App.CollectionStore', CollectionStore);
appRegistry.registerStore('App.NamespaceStore', NamespaceStore);

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
