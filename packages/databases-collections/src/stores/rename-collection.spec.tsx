import React from 'react';
import Sinon from 'sinon';

import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import { RenameCollectionPlugin } from '..';
import { render, cleanup, screen } from '@testing-library/react';

describe('RenameCollectionPlugin', function () {
  const sandbox = Sinon.createSandbox();
  const appRegistry = sandbox.spy(new AppRegistry());
  const dataService = {
    renameCollection: sandbox.stub().resolves({}),
  };
  beforeEach(function () {
    const Plugin = RenameCollectionPlugin.withMockServices({
      globalAppRegistry: appRegistry,
      dataService,
    });

    render(<Plugin> </Plugin>);
  });

  afterEach(function () {
    sandbox.resetHistory();
    cleanup();
  });

  it('handles the open-rename-collection event', function () {
    appRegistry.emit('open-rename-collection', {
      database: 'foo',
      collection: 'bar',
    });

    expect(screen.getByRole('heading', { name: 'Rename collection' })).to.exist;
  });
});
