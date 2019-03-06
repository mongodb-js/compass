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

// const aggregationsActivate = require('@mongodb-js/compass-aggregations').activate;
// const appActivate = require('@mongodb-js/compass-app-stores').activate;
// const authKerbActivate = require('@mongodb-js/compass-auth-kerberos').activate;
// const authLdapActivate = require('@mongodb-js/compass-auth-ldap').activate;
// const authX509Activate = require('@mongodb-js/compass-auth-x509').activate;
// const collectionActivate = require('@mongodb-js/compass-collection').activate;
// const collectionStatsActivate = require('@mongodb-js/compass-collection-stats').activate;
// const collectionDDLActivate = require('@mongodb-js/compass-collections-ddl').activate;
// const connectActivate = require('@mongodb-js/compass-connect').activate;
// const crudActivate = require('@mongodb-js/compass-crud').activate;
// const databaseActivate = require('@mongodb-js/compass-database').activate;
// const databasesDDLActivate = require('@mongodb-js/compass-databases-ddl').activate;
// const daActivate = require('@mongodb-js/compass-deployment-awareness').activate;
// const exportToLangActivate = require('@mongodb-js/compass-export-to-language').activate;
// const fieldStoreActivate = require('@mongodb-js/compass-field-store').activate;
// const findInPageActivate = require('@mongodb-js/compass-find-in-page').activate;
// const importExportActivate = require('@mongodb-js/compass-import-export').activate;
// const indexesActivate = require('@mongodb-js/compass-indexes').activate;
// const instanceActivate = require('@mongodb-js/compass-instance').activate;
// const instanceHeaderActivate = require('@mongodb-js/compass-instance-header').activate;
// const queryBarActivate = require('@mongodb-js/compass-query-bar').activate;
// const queryHistoryActivate = require('@mongodb-js/compass-query-history').activate;
// const schemaValidationActivate = require('@mongodb-js/compass-schema-validation').activate;
// const serverVersionActivate = require('@mongodb-js/compass-server-version').activate;
// const rtssActivate = require('@mongodb-js/compass-serverstats').activate;
// const sidebarActivate = require('@mongodb-js/compass-sidebar').activate;
// const sshTunnelStatusActivate = require('@mongodb-js/compass-ssh-tunnel-status').activate;
// const statusActivate = require('@mongodb-js/compass-status').activate;
const MongoDBInstance = require('mongodb-instance-model');

const appRegistry = new AppRegistry();

global.sinon = require('sinon');
global.expect = chai.expect;
global.hadronApp = hadronApp;
global.hadronApp.appRegistry = appRegistry;
global.hadronApp.instance = new MongoDBInstance();

// aggregationsActivate(appRegistry);
// appActivate(appRegistry);
// authKerbActivate(appRegistry);
// authLdapActivate(appRegistry);
// authX509Activate(appRegistry);
// collectionActivate(appRegistry);
// collectionDDLActivate(appRegistry);
// collectionStatsActivate(appRegistry);
// connectActivate(appRegistry);
// crudActivate(appRegistry);
// databaseActivate(appRegistry);
// databasesDDLActivate(appRegistry);
// daActivate(appRegistry);
// exportToLangActivate(appRegistry);
// fieldStoreActivate(appRegistry);
// findInPageActivate(appRegistry);
// importExportActivate(appRegistry);
// indexesActivate(appRegistry);
// instanceActivate(appRegistry);
// instanceHeaderActivate(appRegistry);
// queryBarActivate(appRegistry);
// queryHistoryActivate(appRegistry);
// schemaValidationActivate(appRegistry);
// serverVersionActivate(appRegistry);
// sshTunnelStatusActivate(appRegistry);
// statusActivate(appRegistry);
// sidebarActivate(appRegistry);
// rtssActivate(appRegistry);

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
