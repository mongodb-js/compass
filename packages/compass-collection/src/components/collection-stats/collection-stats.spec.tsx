import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import CollectionStats from '../collection-stats';

describe('CollectionStats [Component]', function () {
  describe('when rendered', function () {
    afterEach(cleanup);

    beforeEach(function () {
      render(<CollectionStats stats={null} />);
    });

    it('renders the correct root classname', function () {
      expect(screen.getByTestId('collection-stats')).to.exist;
    });

    it('renders the document and index stats', function () {
      expect(screen.getByTestId('document-stats-item')).to.exist;
      expect(screen.getByTestId('index-stats-item')).to.exist;
    });
  });

  describe('when the collection is a time-series collection', function () {
    afterEach(cleanup);

    beforeEach(function () {
      render(<CollectionStats isTimeSeries={true} stats={null} />);
    });

    it('does not render the document stats', function () {
      expect(screen.queryByTestId('document-stats-item')).to.not.exist;
    });

    it('does not render the index stats', function () {
      expect(screen.queryByTestId('index-stats-item')).to.not.exist;
    });
  });
});
