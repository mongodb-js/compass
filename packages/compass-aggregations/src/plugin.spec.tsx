import React from 'react';
import { screen } from '@testing-library/react';
import { expect } from 'chai';
import { renderWithStore } from '../test/configure-store';
import { AggregationsPlugin } from './plugin';

describe('Aggregations [Plugin]', function () {
  it('should render plugin with toolbar and export button', async function () {
    const metadata = {} as any;
    await renderWithStore(
      <AggregationsPlugin {...metadata}></AggregationsPlugin>
    );
    expect(screen.getByTestId('pipeline-toolbar')).to.exist;
    expect(screen.getByTestId('pipeline-toolbar-export-aggregation-button')).to
      .exist;
  });
});
