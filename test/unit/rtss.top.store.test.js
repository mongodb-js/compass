const expect = require('chai').expect;
const app = require('ampersand-app');
const AppRegistry = require('hadron-app-registry');
const mock = require('mock-require');
const sinon = require('sinon');

const DOC_TOO_BIG_ERROR = {message: 'BufBuilder grow() > 64MB'};

const serverStatsActions = {
  suppressTop: require('../../src/internal-packages/server-stats/lib/store/top-store').suppressTop,
  dbError: require('../../src/internal-packages/server-stats/lib/store/dberror-store').dbError,
  pollTop: require('../../src/internal-packages/server-stats/lib/store/top-store').top_delta
};

mock('../../src/internal-packages/server-stats/lib/action', serverStatsActions);


describe('rtss top-store', function() {
  const appRegistry = app.appRegistry;
  const appDataService = app.dataService;
  const appInstance = app.instance;

  before(() => {
    app.appRegistry = new AppRegistry();
  });

  after(() => {
    app.appRegistry = appRegistry;
    app.dataService = appDataService;
    app.instance = appInstance;
  });

  context('when top command returns document larger than 16mb', () => {
    this.spy = sinon.spy();

    before(() => {
      app.dataService = {
        top: this.spy,
        isMongos: () => {
          return false;
        }
      };
    });

    it('calling pollTop once calls the top command', () => {
      serverStatsActions.pollTop();
      expect(this.spy.callCount).to.equal(1);
    });
    it('simulates error once', () => {
      serverStatsActions.dbError({'op': 'top', 'error': DOC_TOO_BIG_ERROR});
      expect(this.spy.callCount).to.equal(1);
    });
    it('calls pollTop again calls the top command', () => {
      serverStatsActions.pollTop();
      expect(this.spy.callCount).to.equal(2);
    });
    it('simulates error again', () => {
      serverStatsActions.dbError({'op': 'top', 'error': DOC_TOO_BIG_ERROR});
      expect(this.spy.callCount).to.equal(2);
    });
    it('calling pollTop again does not call top command', () => {
      serverStatsActions.pollTop();
      expect(this.spy.callCount).to.equal(2);
    });
  });
});
