/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const {shallow} = require('enzyme');
const AppRegistry = require('hadron-app-registry');
const { StatusRow } = require('hadron-react-components');
const ServerStatsStore = require('../../node_modules/compass-serverstats/lib/stores/server-stats-graphs-store');

chai.use(chaiEnzyme());

describe('rtss', () => {
  const appRegistry = app.appRegistry;
  const appDataService = app.dataService;
  const appInstance = app.instance;

  beforeEach(() => {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();
    app.appRegistry.registerComponent('App.StatusRow', StatusRow);
    this.performance = require('../../node_modules/compass-serverstats/lib/components/performance-component');
  });
  afterEach(() => {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.appRegistry = appRegistry;
    app.dataService = appDataService;
    app.instance = appInstance;
  });

  context('when connected to a mongos', () => {
    beforeEach(() => {
      ServerStatsStore.isMongos = true;
      this.component = shallow(<this.performance interval={1000} />);
    });
    afterEach(() => {
      ServerStatsStore.isMongos = false;
    });
    it('displays the top not available in mongos message', () => {
      const state = this.component.find(StatusRow);
      expect(state.dive()).to.have
        .text('Top command is not available for mongos, some charts may not show any data.');
    });
  });
});
