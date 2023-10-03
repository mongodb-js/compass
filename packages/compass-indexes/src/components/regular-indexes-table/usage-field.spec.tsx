import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';

import UsageField, { getUsageTooltip } from './usage-field';

describe('UsageField', function () {
  before(cleanup);
  afterEach(cleanup);

  describe('UsageField Component', function () {
    it('renders usage and since', function () {
      const since = new Date();
      render(<UsageField usage={20} since={since} />);

      const renderedText = `20 (since ${since.toDateString()})`;
      expect(screen.getByText(renderedText)).to.exist;
    });

    it('renders usage unavailable when usage is not defined', function () {
      render(<UsageField />);
      const renderedText = 'Usage data unavailable';
      expect(screen.getByText(renderedText)).to.exist;
    });

    it('renders zero when usage is zero', function () {
      render(<UsageField usage={0} />);
      const renderedText = '0';
      expect(screen.getByText(renderedText)).to.exist;
    });

    it('renders only usage when since is not defined', function () {
      render(<UsageField usage={30} />);
      const renderedText = '30';
      expect(screen.getByText(renderedText)).to.exist;
    });
  });

  describe('getUsageTooltip', function () {
    it('returns correct tooltip', function () {
      expect(getUsageTooltip()).to.equal(
        'Either the server does not support the $indexStats command' +
          ' or the user is not authorized to execute it.'
      );
      expect(getUsageTooltip(0)).to.equal(
        '0 index hits since index creation or last server restart'
      );
      expect(getUsageTooltip(30)).to.equal(
        '30 index hits since index creation or last server restart'
      );
    });
  });
});
