import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';

import UsageField, { getUsageTooltip } from './usage-field';

describe('UsageField', function () {
  before(cleanup);
  afterEach(cleanup);

  describe('UsageField Component', function () {
    it('renders usage', function () {
      const since = new Date();
      render(<UsageField usage={20} since={since} />);

      const renderedText = `20 (since ${since.toDateString()})`;
      expect(screen.getByText(renderedText)).to.exist;
    });

    it('renders zero when usage is not defined', function () {
      const since = new Date();
      render(<UsageField since={since} />);

      const renderedText = `0 (since ${since.toDateString()})`;
      expect(screen.getByText(renderedText)).to.exist;
    });

    it('renders N/A when since is not defined', function () {
      render(<UsageField usage={30} />);
      const renderedText = '30 (N/A)';
      expect(screen.getByText(renderedText)).to.exist;
    });
  });

  describe('getUsageTooltip', function () {
    it('returns correct tooltip', function () {
      expect(getUsageTooltip()).to.equal(
        'Either the server does not support the $indexStats command' +
          'or the user is not authorized to execute it.'
      );
      expect(getUsageTooltip(30)).to.equal(
        '30 index hits since index creation or last server restart'
      );
    });
  });
});
