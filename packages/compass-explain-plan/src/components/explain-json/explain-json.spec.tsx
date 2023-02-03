import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import { ExplainJSON } from '../explain-json';
import { expect } from 'chai';

describe('ExplainJSON [Component]', function () {
  afterEach(cleanup);

  it('renders the correct root classname', async function () {
    const originalExplainData = {};
    const { getByTestId } = render(
      <ExplainJSON originalExplainData={originalExplainData} />
    );
    await waitFor(() => expect(getByTestId('explain-json')).to.exist);
  });
});
