import React from 'react';
import Sinon from 'sinon';
import { DropNamespacePlugin } from '../index';
import type AppRegistry from 'hadron-app-registry';
import toNS from 'mongodb-ns';
import { expect } from 'chai';
import {
  renderWithConnections,
  cleanup,
  screen,
  waitFor,
  userEvent,
  createDefaultConnectionInfo,
} from '@mongodb-js/testing-library-compass';
import type { DataService } from '@mongodb-js/compass-connections/provider';

const mockConnectionInfo = createDefaultConnectionInfo();

describe('DropNamespacePlugin', function () {
  const sandbox = Sinon.createSandbox();
  let appRegistry: Sinon.SinonSpiedInstance<AppRegistry>;
  let dataService: Sinon.SinonSpiedInstance<DataService>;

  beforeEach(async function () {
    const result = renderWithConnections(
      <DropNamespacePlugin></DropNamespacePlugin>,
      {
        connections: [mockConnectionInfo],
        connectFn() {
          return {
            dropDatabase() {
              return Promise.resolve(true);
            },
            dropCollection() {
              return Promise.resolve(true);
            },
          };
        },
      }
    );
    await result.connectionsStore.actions.connect(mockConnectionInfo);
    appRegistry = sandbox.spy(result.globalAppRegistry);
    dataService = sandbox.spy(
      result.getDataServiceForConnection(mockConnectionInfo.id)
    );
  });

  afterEach(function () {
    sandbox.resetHistory();
    cleanup();
  });

  it('should ask for confirmation and delete collection on `open-drop-collection` event', async function () {
    appRegistry.emit('open-drop-collection', toNS('test.to-drop'), {
      connectionId: mockConnectionInfo.id,
    });

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

    expect(appRegistry.emit).to.have.been.calledWithExactly(
      'collection-dropped',
      'test.to-drop',
      { connectionId: mockConnectionInfo.id }
    );
  });

  it('should ask for confirmation and delete database on `open-drop-database` event', async function () {
    appRegistry.emit('open-drop-database', 'db-to-drop', {
      connectionId: mockConnectionInfo.id,
    });

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

    expect(appRegistry.emit).to.have.been.calledWithExactly(
      'database-dropped',
      'db-to-drop',
      { connectionId: mockConnectionInfo.id }
    );
  });
});
