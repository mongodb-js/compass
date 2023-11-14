import React from 'react';
import Sinon from 'sinon';
import { DropNamespacePlugin } from '../index';
import AppRegistry from 'hadron-app-registry';
import toNS from 'mongodb-ns';
import { render, cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';

describe('DropNamespacePlugin', function () {
  const sandbox = Sinon.createSandbox();
  const appRegistry = sandbox.spy(new AppRegistry());
  const dataService = {
    dropDatabase: sandbox.stub().resolves(true),
    dropCollection: sandbox.stub().resolves(true),
  };

  beforeEach(function () {
    const Plugin = DropNamespacePlugin.withMockServices({
      globalAppRegistry: appRegistry,
      dataService,
    });
    render(<Plugin></Plugin>);
  });

  afterEach(function () {
    sandbox.resetHistory();
    cleanup();
  });

  it('should ask for confirmation and delete collection on `open-drop-collection` event', async function () {
    appRegistry.emit('open-drop-collection', toNS('test.to-drop'));

    expect(
      screen.getByText(
        'Are you sure you want to drop collection "test.to-drop"?'
      )
    ).to.exist;

    const input = screen.getByRole('textbox', {
      name: `Type "to-drop" to confirm your action`,
    });

    userEvent.type(input, 'to-drop');

    const dropButton = screen.getByRole('button', { name: 'Drop Collection' });

    userEvent.click(dropButton);

    await waitFor(() => {
      expect(screen.getByText('Collection "test.to-drop" dropped')).to.exist;
    });

    expect(dataService.dropCollection).to.have.been.calledOnceWithExactly(
      'test.to-drop'
    );
    expect(dataService.dropDatabase).to.have.not.been.called;
  });

  it('should ask for confirmation and delete database on `open-drop-database` event', async function () {
    appRegistry.emit('open-drop-database', 'db-to-drop');

    expect(
      screen.getByText('Are you sure you want to drop database "db-to-drop"?')
    ).to.exist;

    const input = screen.getByRole('textbox', {
      name: `Type "db-to-drop" to confirm your action`,
    });

    userEvent.type(input, 'db-to-drop');

    const dropButton = screen.getByRole('button', { name: 'Drop Database' });

    userEvent.click(dropButton);

    await waitFor(() => {
      expect(screen.getByText('Database "db-to-drop" dropped')).to.exist;
    });

    expect(dataService.dropDatabase).to.have.been.calledOnceWithExactly(
      'db-to-drop'
    );
    expect(dataService.dropCollection).to.have.not.been.called;
  });
});
