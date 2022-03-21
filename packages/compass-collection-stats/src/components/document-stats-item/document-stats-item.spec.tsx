import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import DocumentStatsItem from '../document-stats-item';

describe('DocumentStatsItem [Component]', function () {
  describe('when rendered', function () {
    afterEach(cleanup);

    beforeEach(function () {
      render(
        <DocumentStatsItem
          documentCount="10"
          storageSize="5kb"
          avgDocumentSize="1k"
        />
      );
    });

    it('renders the correct root classname', function () {
      expect(screen.getByTestId('document-stats-item')).to.exist;
    });

    it('renders the count as primary', function () {
      const label = screen.getByTestId(
        'document-count-label-primary'
      );
      expect(label).to.have.text('Documents');
      expect(label).to.be.visible;
    });

    it('renders the count as primary value', function () {
      const value = screen.getByTestId(
        'document-count-value-primary'
      );
      expect(value).to.have.text('10');
      expect(value).to.be.visible;
    });

    it('renders storage size as non primary label', function () {
      const label = screen.getByTestId(
        'storage-size-label'
      );
      expect(label).to.have.text('storage size');
      expect(label).to.be.visible;
    });

    it('renders storage size as non primary value', function () {
      const value = screen.getByTestId(
        'storage-size-value'
      );
      expect(value).to.have.text('5kb');
      expect(value).to.be.visible;
    });

    it('renders avg storage size as non primary label', function () {
      const label = screen.getByTestId(
        'avg-document-size-label'
      );
      expect(label).to.have.text('avg. size');
      expect(label).to.be.visible;
    });

    it('renders avg storage size as non primary value', function () {
      const value = screen.getByTestId(
        'avg-document-size-value'
      );
      expect(value).to.have.text('1k');
      expect(value).to.be.visible;
    });
  });

  describe('when time-series is true', function () {
    afterEach(cleanup);

    beforeEach(function () {
      render(
        <DocumentStatsItem
          documentCount="10"
          storageSize="5kb"
          avgDocumentSize="1k"
          isTimeSeries
        />
      );
    });

    it('does not render the count', function () {
      expect(
        screen.queryByTestId(
          'document-count-label-primary'
        )
      ).to.not.exist;
    });

    it('renders storage size as non primary label', function () {
      const label = screen.getByTestId(
        'storage-size-label'
      );
      expect(label).to.have.text('storage size');
      expect(label).to.be.visible;
    });

    it('renders avg document size', function () {
      expect(
        screen.queryByTestId('avg-document-size-label')
      ).to.not.exist;
    });
  });
});
