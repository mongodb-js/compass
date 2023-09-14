import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import userEvent from '@testing-library/user-event';
import type { SearchIndex } from 'mongodb-data-service';

import SearchIndexActions from './search-index-actions';

describe('SearchIndexActions Component', function () {
  let onDropSpy: SinonSpy;

  before(cleanup);
  afterEach(cleanup);
  beforeEach(function () {
    onDropSpy = spy();
    render(
      <SearchIndexActions
        index={{ name: 'artist_id_index' } as SearchIndex}
        onDropIndex={onDropSpy}
      />
    );
  });

  it('renders drop button', function () {
    const button = screen.getByTestId('search-index-actions-drop-action');
    expect(button).to.exist;
    expect(button.getAttribute('aria-label')).to.equal(
      'Drop Index artist_id_index'
    );
    expect(onDropSpy.callCount).to.equal(0);
    userEvent.click(button);
    expect(onDropSpy.callCount).to.equal(1);
  });
});
