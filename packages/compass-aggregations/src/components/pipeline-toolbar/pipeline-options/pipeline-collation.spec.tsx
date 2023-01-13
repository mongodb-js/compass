import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import configureStore from '../../../stores/store';
import PipelineCollation from './pipeline-collation';

describe('PipelineCollation', function () {
  let store: ReturnType<typeof configureStore>;
  beforeEach(function () {
    store = configureStore();
    render(
      <Provider store={store}>
        <PipelineCollation />
      </Provider>
    );
  });

  it('renders the collation toolbar', function () {
    expect(screen.getByTestId('collation-toolbar')).to.exist;
  });

  it('updates the store when a new collation value is typed', function() {
    userEvent.tab();
    expect(screen.getByTestId('collation-string')).to.eq(document.activeElement);
    userEvent.keyboard('8');
    const storeState = store.getState();
    expect(storeState.collationString.value).to.equal(8);
  });

  it('updates the store when a new max time ms value is typed', function() {
    userEvent.tab();
    userEvent.tab();
    expect(screen.getByTestId('max-time-ms')).to.eq(document.activeElement);
    userEvent.keyboard('5');
    const storeState = store.getState();
    expect(storeState.maxTimeMS).to.equal(5);
  });
});
