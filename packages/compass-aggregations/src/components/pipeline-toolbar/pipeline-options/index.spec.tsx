import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../../stores/store';
import { PipelineOptions } from '.';

describe('PipelineOptions', function () {
  let container: HTMLElement;
  beforeEach(function () {
    render(
      <Provider store={configureStore()}>
        <PipelineOptions />
      </Provider>
    );
    container = screen.getByTestId('pipeline-options');
  });

  it('renders the collation toolbar', function () {
    expect(within(container).getByTestId('collation-toolbar')).to.exist;
  });
});
