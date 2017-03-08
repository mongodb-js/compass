const expect = require('chai').expect;
const app = require('hadron-app');
const AppRegistry = require('hadron-app-registry');
const mock = require('mock-require');
const sinon = require('sinon');

const mockDataService = require('./support/mock-data-service');

const DOC_TOO_BIG_ERROR = {message: 'BufBuilder grow() > 64MB'};

const serverStatsActions = {
  suppressTop: require('../../src/internal-packages/server-stats/lib/stores/top-store').suppressTop,
  dbError: require('../../src/internal-packages/server-stats/lib/stores/dberror-store').dbError,
  pollTop: require('../../src/internal-packages/server-stats/lib/stores/top-store').top_delta
};

mock('../../src/internal-packages/server-stats/lib/actions', serverStatsActions);


describe('rtss top-store', function() {
  const appRegistry = app.appRegistry;
  const appInstance = app.instance;

  before(() => {
    app.appRegistry = new AppRegistry();
    mockDataService.before(null, {
      isMongos: false
    })();
  });

  after(() => {
    app.appRegistry = appRegistry;
    mockDataService.after()();
    app.instance = appInstance;
  });

  context('when top command returns document larger than 16mb', () => {
    this.spy = sinon.spy();

    it.skip('calls pollTop and simulates error, the top command runs', () => {
      serverStatsActions.pollTop();
      serverStatsActions.dbError({'op': 'top', 'error': DOC_TOO_BIG_ERROR});
      expect(this.spy.callCount).to.equal(1);
    });
    it.skip('calls pollTop again and simulates error, the top command runs again', () => {
      serverStatsActions.pollTop();
      serverStatsActions.dbError({'op': 'top', 'error': DOC_TOO_BIG_ERROR});
      expect(this.spy.callCount).to.equal(2);
    });
    it.skip('calls pollTop again but top command is disabled because of errors', (done) => {
      setTimeout(() => {
        serverStatsActions.pollTop();
        expect(this.spy.callCount).to.equal(2);
        done();
      }, 0);
    });
  });
});
