import React from 'react';
import Sinon from 'sinon';

import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import { RenameCollectionPlugin } from '..';
import { render, cleanup, screen, waitFor } from '@testing-library/react';

describe('RenameCollectionPlugin', function () {
  const sandbox = Sinon.createSandbox();
  const appRegistry = sandbox.spy(new AppRegistry());
  const dataService = {
    renameCollection: sandbox.stub().resolves({}),
  };
  const favoriteQueries = {
    getStorage: () => ({
      loadAll: sandbox.stub().resolves([]),
    }),
  };
  const pipelineStorage = {
    loadAll: sandbox.stub().resolves([]),
  };
  const instanceModel = {
    databases: {
      get: function () {
        return {
          collections: [{ name: 'my-collection' }],
        };
      },
    },
  };
  beforeEach(function () {
    const Plugin = RenameCollectionPlugin.withMockServices({
      globalAppRegistry: appRegistry,
      dataService,
      instance: instanceModel as any,
      queryStorage: favoriteQueries as any,
      pipelineStorage: pipelineStorage as any,
    });

    render(<Plugin> </Plugin>);
  });

  afterEach(function () {
    sandbox.resetHistory();
    cleanup();
  });

  it('handles the open-rename-collection event', async function () {
    appRegistry.emit('open-rename-collection', {
      database: 'foo',
      collection: 'bar',
    });
    await waitFor(() => screen.getByText('Rename collection'));

    expect(screen.getByRole('heading', { name: 'Rename collection' })).to.exist;
  });
});
