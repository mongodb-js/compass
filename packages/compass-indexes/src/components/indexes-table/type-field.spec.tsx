import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';

import TypeField from './type-field';
import getIndexHelpLink from '../../utils/index-link-helper';

describe('TypeField Component', function () {
  before(cleanup);
  afterEach(cleanup);
  it('renders index type', function () {
    render(<TypeField type="text" extra={{}} />);

    const badge = screen.getByTestId('text-badge');
    expect(badge).to.exist;

    expect(badge.textContent).to.equal('text');
    const infoIcon = within(badge).getByRole('img', {
      name: /info with circle icon/i,
    });
    expect(infoIcon).to.exist;
    expect(infoIcon.closest('a')?.href).to.equal(getIndexHelpLink('TEXT'));
  });

  it('renders index type - with extra information', function () {
    render(
      <TypeField
        type="hashed"
        extra={{
          wildcardProjection: { _id: true },
        }}
      />
    );

    const badge = screen.getByTestId('hashed-badge');
    expect(badge).to.exist;
    // todo: tooltip test
  });
});
