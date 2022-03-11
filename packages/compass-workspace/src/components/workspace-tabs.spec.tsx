import React from 'react';
import {
  render,
  screen,
  cleanup,
} from '@testing-library/react';
import { expect } from 'chai';

import { WorkspaceTabs } from './workspace-tabs';

describe('WorkspaceTabs', function () {
  afterEach(cleanup);

  it('should render a create new tab button', async function () {
    render(<WorkspaceTabs
      onCreateNewTab={() => { /* */ }}
      onCloseTab={() => { /* */ }}
      onSelectTab={() => { /* */ }}
      tabs={[]}
    />);

    expect(await screen.findByLabelText('Create new tab')).to.be.visible;
  });
});
