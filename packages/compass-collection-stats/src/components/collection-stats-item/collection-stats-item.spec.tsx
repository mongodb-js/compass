import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import CollectionStatsItem from '../collection-stats-item';

describe('CollectionStatsItem [Component]', function () {
  context('when the component is not primary', function () {
    afterEach(cleanup);

    beforeEach(function () {
      render(
        <CollectionStatsItem label="label" value="10kb" dataTestId="test" />
      );
    });

    it('renders the correct root classname', function () {
      expect(screen.getByTestId('test')).to.exist;
    });

    it('renders the label', function () {
      const label = screen.getByTestId('test-label');
      expect(label).to.have.text('label');
      expect(label).to.be.visible;
    });

    it('renders the value', function () {
      const value = screen.getByTestId('test-value');
      expect(value).to.have.text('10kb');
      expect(value).to.be.visible;
    });
  });

  context('when the component is primary', function () {
    afterEach(cleanup);

    beforeEach(function () {
      render(
        <CollectionStatsItem label="label" value="20kb" dataTestId="test" />
      );
    });

    it('renders the correct root classname', function () {
      expect(screen.getByTestId('test')).to.exist;
    });

    it('renders the label', function () {
      const label = screen.getByTestId('test-label');
      expect(label).to.have.text('label');
      expect(label).to.be.visible;
    });

    it('renders the value', function () {
      const value = screen.getByTestId('test-value');
      expect(value).to.have.text('20kb');
      expect(value).to.be.visible;
    });
  });
});
