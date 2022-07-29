import React from 'react';
import { render, cleanup, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import type { IndexDirection } from 'mongodb';

import IndexKeys from './index-keys';

describe('IndexKeys Component', function () {
  afterEach(cleanup);

  it('should render the keys of an index', function () {
    const keys: Record<string, IndexDirection> = {
      name: 1,
      user_id: -1,
      tagline: 'text',
    };
    render(<IndexKeys keys={keys} />);

    // name
    const name = screen.getByTestId('name-key');
    expect(within(name).getByText(/name/i)).to.exist;
    expect(
      within(name).getByRole('img', {
        name: /arrow up icon/i,
      })
    ).to.exist;

    // user_id
    const userId = screen.getByTestId('user_id-key');
    expect(within(userId).getByText(/user_id/i)).to.exist;
    expect(
      within(userId).getByRole('img', {
        name: /arrow down icon/i,
      })
    ).to.exist;

    // tagline (other index types)
    expect(
      within(screen.getByTestId('tagline-key')).getByText(/tagline \(text\)/i)
    ).to.exist;
  });
});
