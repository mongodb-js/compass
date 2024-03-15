import React from 'react';
import { expect } from 'chai';
import { stub } from 'sinon';
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
  queryByTestId,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultipleConnectionSidebar } from './sidebar';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { ToastArea } from '@mongodb-js/compass-components';
import {
  ConnectionRepositoryContextProvider,
  ConnectionStorageContext,
  type ConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import { ConnectionRepository } from '@mongodb-js/connection-storage/main';
import { DataService } from 'mongodb-data-service/provider';

const slowConnection = (response) =>
  new Promise<DataService>((resolve, reject) => {
    setTimeout(() => resolve(response(resolve, reject)), 20);
  });

const andFail = (message: string) => (resolve, reject) => reject({ message });
const andSucceed = () => (resolve, reject) => resolve({} as DataService);

const savedConnection: ConnectionInfo = {
  id: '12345',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  favorite: {
    name: 'localhost',
    color: 'color2',
  },
  savedConnectionType: 'favorite',
};

describe('Multiple Connections Sidebar Component', function () {
  const connectionStorage: Pick<
    typeof ConnectionStorage,
    'loadAll' | 'load' | 'save' | 'delete'
  > = {
    loadAll: stub(),
    load: stub(),
    save: stub(),
    delete: stub(),
  };

  const connectFn = stub();

  function doRender() {
    return render(
      <ToastArea>
        <ConnectionStorageContext.Provider
          value={connectionStorage as ConnectionStorage}
        >
          <ConnectionRepositoryContextProvider>
            <MultipleConnectionSidebar
              appName="Sidebar Spec"
              connectFn={connectFn}
            />
          </ConnectionRepositoryContextProvider>
        </ConnectionStorageContext.Provider>
      </ToastArea>
    );
  }

  beforeEach(function () {
    connectionStorage.loadAll.returns([savedConnection]);

    doRender();
  });

  afterEach(function () {
    connectionStorage.loadAll.reset();
    connectionStorage.load.reset();
    connectionStorage.save.reset();
    connectionStorage.delete.reset();

    cleanup();
  });

  describe('opening a new connection', function () {
    let parentSavedConnection: HTMLElement;

    describe('when successfully connected', function () {
      it('calls the connection function and renders the progress toast', async function () {
        connectFn.returns(slowConnection(andSucceed()));
        parentSavedConnection = screen.queryByTestId('saved-connection-12345');

        userEvent.hover(parentSavedConnection);

        const connectButton = within(parentSavedConnection).queryByLabelText(
          'Connect'
        );

        userEvent.click(connectButton);
        const connectingToast = await screen.getByText(
          'Connecting to localhost'
        );
        expect(connectingToast).to.exist;
        expect(connectFn).to.have.been.called;

        await waitFor(() => {
          expect(screen.queryByText('Connecting to localhost')).to.not.exist;
        });
      });
    });

    describe('when failing to connect', function () {
      it('calls the connection function and renders the error toast', async function () {
        connectionStorage.loadAll.returns([savedConnection]);
        connectFn.returns(slowConnection(andFail('Expected failure')));
        parentSavedConnection = screen.queryByTestId('saved-connection-12345');

        userEvent.hover(parentSavedConnection);

        const connectButton = within(parentSavedConnection).queryByLabelText(
          'Connect'
        );

        userEvent.click(connectButton);
        const connectingToast = await screen.getByText(
          'Connecting to localhost'
        );
        expect(connectingToast).to.exist;
        expect(connectFn).to.have.been.called;

        await waitFor(() => {
          expect(screen.queryByText('Expected failure')).to.exist;
        });
      });
    });
  });
});
