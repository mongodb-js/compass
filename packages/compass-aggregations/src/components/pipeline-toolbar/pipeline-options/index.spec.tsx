import React from 'react';
import { screen, within } from '@testing-library/react';
import { expect } from 'chai';

import { renderWithStore } from '../../../../test/configure-store';
import { PipelineOptions } from '.';

describe('PipelineOptions', function () {
  let container: HTMLElement;
  beforeEach(async function () {
    await renderWithStore(<PipelineOptions />);
    container = screen.getByTestId('pipeline-options');
  });

  it('renders the collation toolbar', function () {
    expect(within(container).getByTestId('collation-toolbar')).to.exist;
  });
});
