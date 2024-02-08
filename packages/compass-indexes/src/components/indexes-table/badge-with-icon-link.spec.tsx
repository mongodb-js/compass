import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';

import BadgeWithIconLink from './badge-with-icon-link';

describe('BadgeWithIconLink Component', function () {
  before(cleanup);
  afterEach(cleanup);
  it('render a badge with icon', function () {
    render(<BadgeWithIconLink link="https://mongodb.com/" text="mongodb" />);
    const container = screen.getByTestId('mongodb-badge');
    expect(within(container).getByText(/mongodb/i)).to.exist;
    const infoIcon = within(container).getByRole('img', {
      name: /info with circle icon/i,
    });
    expect(infoIcon).to.exist;
    expect(infoIcon.closest('a')?.href).to.equal('https://mongodb.com/');
  });
});
