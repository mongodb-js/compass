import React from 'react';
import { expect } from 'chai';

import Aggregations from '.';
import { renderWithStore } from '../../../test/configure-store';
import { cleanup, screen } from '@testing-library/react';

describe('Aggregations [Component]', function () {
  beforeEach(async function () {
    await renderWithStore(
      <Aggregations
        showExportButton={true}
        showRunButton={true}
        showExplainButton={true}
      />
    );
  });

  afterEach(function () {
    cleanup();
  });

  it('renders the correct root classname', function () {
    expect(screen.getByTestId('compass-aggregations')).exist;
  });
});
