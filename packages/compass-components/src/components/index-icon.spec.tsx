import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import { expect } from 'chai';

import IndexIcon from './index-icon';

describe('IndexIcon Component', function () {
  afterEach(cleanup);

  it('should render up arrow', function () {
    render(<IndexIcon direction={1} />);
    expect(
      screen.getByRole('img', {
        name: /ascending index/i,
      })
    ).to.exist;
  });

  it('should render down arrow', function () {
    render(<IndexIcon direction={-1} />);
    expect(
      screen.getByRole('img', {
        name: /descending index/i,
      })
    ).to.exist;
  });

  it('should render index direction when its not 1 or -1', function () {
    render(<IndexIcon direction={'something'} />);
    expect(screen.getByText(/\(something\)/i)).to.exist;
  });
});
