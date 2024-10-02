import React from 'react';
import {
  cleanup,
  render,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';

import InProgressIndexActions from './in-progress-index-actions';

describe('IndexActions Component', function () {
  let onDeleteSpy: SinonSpy;

  before(cleanup);
  afterEach(cleanup);
  beforeEach(function () {
    onDeleteSpy = spy();
  });

  it('does not render the delete button for an in progress index that is still in progress', function () {
    render(
      <InProgressIndexActions
        index={{
          name: 'artist_id_index',
          status: 'inprogress',
        }}
        onDeleteFailedIndexClick={onDeleteSpy}
      />
    );

    const button = screen.queryByTestId('index-actions-delete-action');
    expect(button).to.not.exist;
  });

  it('renders delete button for an in progress index that has failed', function () {
    render(
      <InProgressIndexActions
        index={{
          name: 'artist_id_index',
          status: 'failed',
        }}
        onDeleteFailedIndexClick={onDeleteSpy}
      />
    );

    const button = screen.getByTestId('index-actions-delete-action');
    expect(button).to.exist;
    expect(button.getAttribute('aria-label')).to.equal(
      'Drop Index artist_id_index'
    );
    expect(onDeleteSpy.callCount).to.equal(0);
    userEvent.click(button);
    expect(onDeleteSpy.callCount).to.equal(1);
  });
});
