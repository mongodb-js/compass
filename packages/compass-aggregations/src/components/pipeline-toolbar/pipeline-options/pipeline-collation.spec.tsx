import React from 'react';
import { screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import { renderWithStore } from '../../../../test/configure-store';
import PipelineCollation from './pipeline-collation';
import type { AggregationsStore } from '../../../stores/store';

describe('PipelineCollation', function () {
  let store: AggregationsStore;
  beforeEach(async function () {
    const result = await renderWithStore(<PipelineCollation />);
    store = result.plugin.store;
  });

  it('renders the collation toolbar', function () {
    expect(screen.getByTestId('collation-toolbar')).to.exist;
  });

  it('updates the store when a new collation value is typed', function () {
    userEvent.tab();
    expect(screen.getByTestId('collation-string')).to.eq(
      document.activeElement
    );
    userEvent.keyboard('8');
    const storeState = store.getState();
    expect(storeState.collationString.value).to.equal(8);
  });

  it('updates the store when a new max time ms value is typed', function () {
    userEvent.tab();
    userEvent.tab();
    expect(screen.getByTestId('max-time-ms')).to.eq(document.activeElement);
    userEvent.clear(screen.getByTestId('max-time-ms'));
    userEvent.keyboard('5');
    const storeState = store.getState();
    expect(storeState.maxTimeMS).to.equal(5);
  });
});
