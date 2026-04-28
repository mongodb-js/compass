import React from 'react';
import { expect } from 'chai';

import Aggregations from '.';
import { renderWithStore } from '../../../test/configure-store';
import { screen } from '@mongodb-js/testing-library-compass';

describe('Aggregations [Component]', function () {
  beforeEach(async function () {
    await renderWithStore(
      <Aggregations showRunButton={true} showExplainButton={true} />
    );
  });

  it('renders the correct root classname', function () {
    expect(screen.getByTestId('compass-aggregations')).exist;
  });
});
