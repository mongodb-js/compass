const chai = require('chai');
const expect = chai.expect;
const React = require('react');
const ServerStatsStore = require('../../src/stores/server-stats-graphs-store');
const TopStore = require('../../src/stores/top-store');
const { PerformanceComponent } = require('../../src/components/');
const { render, screen } = require('@mongodb-js/testing-library-compass');

describe('rtss', function () {
  context('when connected to a mongos', function () {
    beforeEach(function () {
      ServerStatsStore.isMongos = true;
      render(<PerformanceComponent />);
    });

    afterEach(function () {
      ServerStatsStore.isMongos = false;
    });

    it('displays the top not available in mongos message', function () {
      expect(
        screen.getByText(
          'Top command is not available for mongos, some charts may not show any data.'
        )
      ).to.exist;
    });
  });

  context(
    'when top is unable to retrieve information about some collections',
    function () {
      beforeEach(function () {
        TopStore.topUnableToRetrieveSomeCollections = true;
        render(<PerformanceComponent />);
      });

      afterEach(function () {
        TopStore.topUnableToRetrieveSomeCollections = false;
      });

      it('displays a warning message', function () {
        expect(
          screen.getByText(
            'Top command is unable to retrieve information about certain collections, resulting in incomplete data being displayed on the charts.'
          )
        ).to.exist;
      });
    }
  );
});
