import React from 'react';
import { expect } from 'chai';

import { cleanup, screen } from '@mongodb-js/testing-library-compass';
import { renderWithStore } from '../../../test/configure-store';
import Aggregations from '.';

describe('Aggregations [Component]', function () {
  beforeEach(async function () {
    await renderWithStore(
      <Aggregations showRunButton={true} showExplainButton={true} />
    );
  });

  afterEach(function () {
    cleanup();
  });

  it('renders the correct root classname', function () {
    expect(screen.getByTestId('compass-aggregations')).exist;
  });
});
