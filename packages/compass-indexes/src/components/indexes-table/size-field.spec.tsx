import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';

import SizeField, { formatSize, getSizeTooltip } from './size-field';

describe('SizeField', function () {
  before(cleanup);
  afterEach(cleanup);
  describe('SizeField Component', function () {
    it('renders size', function () {
      render(<SizeField size={20} relativeSize={15} />);
      expect(screen.getByText(/20 b/i)).to.exist;
    });
  });

  describe('SizeField functions', function () {
    it('formats size', function () {
      expect(formatSize(908)).to.equal('908 B');
      expect(formatSize(2020)).to.equal('2.0 KB');
      expect(formatSize(202020)).to.equal('202.0 KB');
    });

    it('returns correct tooltip', function () {
      expect(getSizeTooltip(20)).to.equal('20.00% compared to largest index');
      expect(getSizeTooltip(8)).to.equal('8.00% compared to largest index');
    });
  });
});
