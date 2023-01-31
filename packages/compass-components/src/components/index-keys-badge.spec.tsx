import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { IndexKeysBadge } from './index-keys-badge';

describe('IndexKeysBadge Component', function () {
  before(cleanup);
  afterEach(cleanup);
  it('renders name with keys', function () {
    const keys = [
      {
        field: 'album_id',
        value: 1,
      },
      {
        field: 'artist_id',
        value: -1,
      },
      {
        field: 'title',
        value: 'text',
      },
    ];
    render(<IndexKeysBadge keys={keys as any} />);

    const keysList = screen.getByRole('list');

    const albumBadge = within(keysList).getByTestId('album_id-key');
    expect(albumBadge).to.exist;
    expect(
      within(albumBadge).getByRole('img', {
        name: /ascending index/i,
      })
    ).to.exist;
    expect(albumBadge.textContent).to.equal('album_id');

    const artistBadge = within(keysList).getByTestId('artist_id-key');
    expect(artistBadge).to.exist;
    expect(
      within(artistBadge).getByRole('img', {
        name: /descending index/i,
      })
    ).to.exist;
    expect(artistBadge.textContent).to.equal('artist_id');

    const titleBadge = within(keysList).getByTestId('title-key');
    expect(titleBadge).to.exist;
    expect(titleBadge.textContent).to.equal('title(text)');
  });
});
