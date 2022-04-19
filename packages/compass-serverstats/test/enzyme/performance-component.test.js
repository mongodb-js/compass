/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const expect = chai.expect;
const React = require('react');
const { shallow } = require('enzyme');
const { Banner } = require('@mongodb-js/compass-components');
const ServerStatsStore = require('../../src/stores/server-stats-graphs-store');
const { PerformanceComponent } = require('../../src/components/');

describe('rtss', () => {
  const appDataService = app.dataService;
  const appInstance = app.instance;

  afterEach(() => {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.dataService = appDataService;
    app.instance = appInstance;
  });

  context('when connected to a mongos', () => {
    let component = null;

    beforeEach(() => {
      ServerStatsStore.isMongos = true;
      component = shallow(<PerformanceComponent />);
    });

    afterEach(() => {
      ServerStatsStore.isMongos = false;
    });

    it('displays the top not available in mongos message', () => {
      const state = component.find(Banner);
      expect(state.dive().text()).to.include(
        'Top command is not available for mongos, some charts may not show any data.'
      );
    });
  });
});
