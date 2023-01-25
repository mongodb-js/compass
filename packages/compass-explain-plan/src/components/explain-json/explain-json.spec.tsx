import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import { AppRegistry } from 'hadron-app-registry';
import hadronApp from 'hadron-app';
import { ExplainJSON } from '../explain-json';
import { expect } from 'chai';

describe('ExplainJSON [Component]', function () {
  before(function () {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = new AppRegistry();
  });

  afterEach(cleanup);

  it('renders the correct root classname', async function () {
    const originalExplainData = {};
    const { getByTestId } = render(
      <ExplainJSON originalExplainData={originalExplainData} />
    );
    await waitFor(() => expect(getByTestId('explain-json')).to.exist);
  });
});
