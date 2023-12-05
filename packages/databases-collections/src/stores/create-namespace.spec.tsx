import React from 'react';
import Sinon from 'sinon';
import { CreateNamespacePlugin } from '../index';
import AppRegistry from 'hadron-app-registry';
import {
  render,
  cleanup,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';

describe('CreateNamespacePlugin', function () {
  const sandbox = Sinon.createSandbox();
  const appRegistry = sandbox.spy(new AppRegistry());
  const dataService = {
    createCollection: sandbox.stub().resolves({}),
    createDataKey: sandbox.stub().resolves({}),
    configuredKMSProviders: sandbox.stub().returns([]),
  };
  const instance = {
    on: sandbox.stub(),
    off: sandbox.stub(),
    removeListener: sandbox.stub(),
    build: { version: '999.999.999' },
    topologyDescription: { type: 'Unknown' },
  };

  beforeEach(function () {
    const Plugin = CreateNamespacePlugin.withMockServices({
      globalAppRegistry: appRegistry,
      dataService,
      instance: instance as any,
    });
    render(<Plugin></Plugin>);
  });

  afterEach(function () {
    sandbox.resetHistory();
    cleanup();
  });

  it('should handle create database flow on `open-create-database` event', async function () {
    appRegistry.emit('open-create-database');

    expect(screen.getByRole('heading', { name: 'Create Database' })).to.exist;

    userEvent.type(
      screen.getByRole('textbox', { name: 'Database Name' }),
      'db'
    );

    userEvent.type(
      screen.getByRole('textbox', { name: 'Collection Name' }),
      'coll1'
    );

    userEvent.click(screen.getByRole('button', { name: 'Create Database' }));

    await waitForElementToBeRemoved(
      screen.queryByRole('heading', { name: 'Create Database' })
    );

    expect(dataService.createCollection).to.have.been.calledOnceWith(
      'db.coll1',
      {}
    );
  });

  it('should handle create collection flow on `open-create-collection` event', async function () {
    appRegistry.emit('open-create-collection', { database: 'db' });

    expect(screen.getByRole('heading', { name: 'Create Collection' })).to.exist;

    expect(screen.queryByRole('textbox', { name: 'Database Name' })).to.not
      .exist;

    userEvent.type(
      screen.getByRole('textbox', { name: 'Collection Name' }),
      'coll2'
    );

    userEvent.click(screen.getByRole('button', { name: 'Create Collection' }));

    await waitForElementToBeRemoved(
      screen.queryByRole('heading', { name: 'Create Collection' })
    );

    expect(dataService.createCollection).to.have.been.calledOnceWith(
      'db.coll2',
      {}
    );
  });
});
