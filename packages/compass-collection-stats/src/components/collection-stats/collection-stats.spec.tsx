import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import CollectionStats from '../collection-stats';
import DocumentStatsItem from '../document-stats-item';
import IndexStatsItem from '../index-stats-item';

describe('CollectionStats [Component]', function () {
  describe('when rendered', function () {
    afterEach(cleanup);

    beforeEach(function () {
      global.hadronApp = {
        appRegistry: new AppRegistry()
      };

      render(<CollectionStats
        isReadonly={false}
        isTimeSeries={false}
      />);
    });

    it('renders the correct root classname', function () {
      expect(screen.getByTestId('collection-stats')).to.exist;
    });

    it('renders the document and index stats', function () {
      expect(screen.getByTestId('document-stats-item')).to.exist;
      expect(screen.getByTestId('index-stats-item')).to.exist;
    });
  });

  describe('When the collection is a view', function () {
    afterEach(cleanup);

    before(function () {
      render(<CollectionStats
        isReadonly
        isTimeSeries={false}
      />);
    });

    it('renders an empty state', function () {
      expect(screen.getByTestId('collection-stats-empty')).to.exist;
    });

    it('does not render the document and index stats', function () {
      expect(screen.queryByTestId('document-stats-item')).to.not.exist;
      expect(screen.queryByTestId('index-stats-item')).to.not.exist;
    });
  });

  describe('when the collection is a time-series collection', function () {
    afterEach(cleanup);

    beforeEach(function () {
      global.hadronApp = {
        appRegistry: new AppRegistry()
      };

      render(<CollectionStats
        isReadonly={false}
        isTimeSeries
      />);
    });

    it('renders the document stats', function () {
      expect(screen.getByTestId('document-stats-item')).to.exist;
    });

    it('does not render the index stats', function () {
      expect(screen.queryByTestId('index-stats-item')).to.not.exist;
    });
  });
});
