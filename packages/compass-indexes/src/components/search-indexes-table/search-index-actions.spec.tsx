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
  let onEditSpy: SinonSpy;
  let onRunAggregateIndexSpy: SinonSpy;

  before(cleanup);
  afterEach(cleanup);
  beforeEach(function () {
    onDropSpy = spy();
    onEditSpy = spy();
    onRunAggregateIndexSpy = spy();

    render(
      <SearchIndexActions
        index={{ name: 'artist_id_index' } as SearchIndex}
        onDropIndex={onDropSpy}
        onEditIndex={onEditSpy}
        onRunAggregateIndex={onRunAggregateIndexSpy}
      />
    );
  });

  it('renders run aggregate button', function () {
    const button = screen.getByTestId('search-index-actions-aggregate-action');

    expect(button).to.exist;
    expect(onRunAggregateIndexSpy.callCount).to.equal(0);
    userEvent.click(button);
    expect(onRunAggregateIndexSpy.callCount).to.equal(1);
    expect(onRunAggregateIndexSpy.firstCall.args).to.deep.equal([
      'artist_id_index',
    ]);
  });

  it('renders drop button', function () {
    const dropButton = screen.getByTestId('search-index-actions-drop-action');

    expect(dropButton).to.exist;
    expect(dropButton.getAttribute('aria-label')).to.equal(
      'Drop Index artist_id_index'
    );
    expect(onDropSpy.callCount).to.equal(0);
    userEvent.click(dropButton);
    expect(onDropSpy.callCount).to.equal(1);
    expect(onDropSpy.firstCall.args).to.deep.equal(['artist_id_index']);
  });

  it('renders edit button', function () {
    const editButton = screen.getByTestId('search-index-actions-edit-action');

    expect(editButton).to.exist;
    expect(editButton.getAttribute('aria-label')).to.equal(
      'Edit Index artist_id_index'
    );
    expect(onEditSpy.callCount).to.equal(0);
    userEvent.click(editButton);
    expect(onEditSpy.callCount).to.equal(1);
    expect(onEditSpy.firstCall.args).to.deep.equal(['artist_id_index']);
  });
});
