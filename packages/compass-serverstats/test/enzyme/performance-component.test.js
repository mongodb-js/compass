/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const expect = chai.expect;
const React = require('react');
const { mount } = require('enzyme');
const { Banner } = require('@mongodb-js/compass-components');
const ServerStatsStore = require('../../src/stores/server-stats-graphs-store');
const TopStore = require('../../src/stores/top-store');
const { PerformanceComponent } = require('../../src/components/');

describe('rtss', function () {
  const appDataService = app.dataService;
  const appInstance = app.instance;

  afterEach(function () {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.dataService = appDataService;
    app.instance = appInstance;
  });

  context('when connected to a mongos', function () {
    let component = null;

    beforeEach(function () {
      ServerStatsStore.isMongos = true;
      component = mount(<PerformanceComponent />);
    });

    afterEach(function () {
      ServerStatsStore.isMongos = false;
      component.unmount();
    });

    it('displays the top not available in mongos message', function () {
      const state = component.find(Banner);
      expect(state.text()).to.include(
        'Top command is not available for mongos, some charts may not show any data.'
      );
    });
  });

  context(
    'when top is unable to retrieve information about some collections',
    function () {
      let component = null;

      beforeEach(function () {
        TopStore.topUnableToRetrieveSomeCollections = true;
        component = mount(<PerformanceComponent />);
      });

      afterEach(function () {
        TopStore.topUnableToRetrieveSomeCollections = false;
        component.unmount();
      });

      it('displays a warning message', function () {
        const state = component.find(Banner);
        expect(state.text()).to.include(
          'Top command is unable to retrieve information about certain collections, resulting in incomplete data being displayed on the charts.'
        );
      });
    }
  );
});
