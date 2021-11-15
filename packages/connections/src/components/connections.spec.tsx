// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TestBackend } = require('storage-mixin');

import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuid } from 'uuid';
import { convertConnectionInfoToModel } from 'mongodb-data-service';
import sinon from 'sinon';

import Connections from './connections';

function getConnectionFilePath(tmpDir: string, id: string): string {
  const connectionsDir = path.join(tmpDir, 'Connections');
  const filePath = path.join(connectionsDir, `${id}.json`);
  return filePath;
}

// TODO: In typescript 4.5 we can just use Awaited and remove this.
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

function writeFakeConnection(
  tmpDir: string,
  legacyConnection: Partial<
    Awaited<ReturnType<typeof convertConnectionInfoToModel>>
  > & { _id: string }
) {
  const filePath = getConnectionFilePath(tmpDir, legacyConnection._id);
  const connectionsDir = path.dirname(filePath);
  fs.mkdirSync(connectionsDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(legacyConnection));
}

describe('Connections Component', function () {
  let onConnectedSpy;

  beforeEach(function () {
    onConnectedSpy = sinon.spy();
  });

  describe('when rendered', function () {
    let tmpDir: string;

    before(function () {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'connections-tests'));
      TestBackend.enable(tmpDir);
    });

    after(function () {
      TestBackend.disable();
      try {
        fs.rmdirSync(tmpDir, { recursive: true });
      } catch (e) {
        /* */
      }
    });

    beforeEach(function () {
      render(<Connections onConnected={onConnectedSpy} />);
    });

    afterEach(function () {
      cleanup();
    });

    it('renders the connect button from the connect-form', function () {
      const button = screen.queryByText('Connect').closest('button');
      expect(button).to.not.equal(null);
    });

    it('renders atlas cta button', function () {
      const button = screen.getByTestId('atlas-cta-link');
      expect(button.getAttribute('href')).to.equal(
        'https://www.mongodb.com/cloud/atlas/lp/general/try?utm_source=compass&utm_medium=product'
      );
    });

    it('shows two connections lists', function () {
      const listItems = screen.getAllByRole('list');
      expect(listItems.length).to.equal(2);
    });

    it('should load an empty connections list with no connections', function () {
      const listItems = screen.queryAllByRole('listitem');
      expect(listItems.length).to.equal(0);

      const favorites = screen.queryAllByTestId('favorite-connection');
      expect(favorites.length).to.equal(0);

      const recents = screen.queryAllByTestId('recent-connection');
      expect(recents.length).to.equal(0);
    });
  });

  describe('when rendered with saved connections in storage', function () {
    let savedConnectionId: string;
    let tmpDir: string;

    beforeEach(async function () {
      render(<Connections onConnected={onConnectedSpy} />);

      await waitFor(() => expect(screen.queryByRole('listitem')).to.be.visible);
    });

    before(function () {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'connections-tests'));
      TestBackend.enable(tmpDir);

      savedConnectionId = uuid();
      writeFakeConnection(tmpDir, {
        _id: savedConnectionId,
        port: 27018,
      });
    });

    after(function () {
      TestBackend.disable();
      try {
        fs.rmdirSync(tmpDir, { recursive: true });
      } catch (e) {
        /* */
      }
    });

    afterEach(function () {
      cleanup();
    });

    it('should render the saved connections', function () {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).to.equal(1);

      const favorites = screen.queryAllByTestId('favorite-connection');
      expect(favorites.length).to.equal(0);

      const recents = screen.getAllByTestId('recent-connection');
      expect(recents.length).to.equal(1);
    });

    it('renders the title of the saved connection', function () {
      expect(screen.getByText('localhost:27018')).to.be.visible;
    });

    describe('when the saved connection is clicked on and connected to', function () {
      beforeEach(async function () {
        const savedConnectionButton = screen.getByTestId(
          `saved-connection-button-${savedConnectionId}`
        );
        fireEvent.click(savedConnectionButton);

        // Wait for the connection to load in the form.
        await waitFor(() =>
          expect(screen.queryByRole('textbox').textContent).to.equal(
            'mongodb://localhost:27018/?readPreference=primary&ssl=false'
          )
        );

        const connectButton = screen.getByText('Connect');
        fireEvent.click(connectButton);

        await waitFor(
          () => expect(screen.queryByTestId('connections-connected')).to.exist
        );
      });

      afterEach(async function () {
        await onConnectedSpy.firstCall?.args[1].disconnect().catch(console.log);
      });

      it('should emit the connection configuration used to connect', function () {
        expect(onConnectedSpy.firstCall.args[0]).to.deep.equal({
          id: savedConnectionId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27018/?readPreference=primary&ssl=false',
          },
        });
      });

      it('should emit the data service', function () {
        expect(onConnectedSpy.firstCall.args[1].isWritable).to.not.equal(
          undefined
        );
      });
    });
  });

  describe('connecting to a connection that is not succeeding', function () {
    let savedConnectableId: string;
    let savedUnconnectableId: string;
    let tmpDir: string;

    before(async function () {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'connections-tests'));
      TestBackend.enable(tmpDir);

      savedConnectableId = uuid();
      savedUnconnectableId = uuid();
      writeFakeConnection(tmpDir, {
        _id: savedConnectableId,
        port: 27018,
      });

      const connectionModel = await convertConnectionInfoToModel({
        id: savedUnconnectableId,
        connectionOptions: {
          // Hopefully nothing is running on this port.
          // Times out in 5000ms.
          connectionString:
            'mongodb://localhost:28099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000',
        },
      });
      writeFakeConnection(tmpDir, connectionModel);
    });

    after(function () {
      TestBackend.disable();
      try {
        fs.rmdirSync(tmpDir, { recursive: true });
      } catch (e) {
        /* */
      }
    });

    beforeEach(async function () {
      render(<Connections onConnected={onConnectedSpy} />);

      await waitFor(
        () =>
          expect(
            screen.queryByTestId(
              `saved-connection-button-${savedUnconnectableId}`
            )
          ).to.exist
      );

      const savedConnectionButton = screen.getByTestId(
        `saved-connection-button-${savedUnconnectableId}`
      );
      fireEvent.click(savedConnectionButton);

      // Wait for the connection to load in the form.
      await waitFor(() =>
        expect(screen.queryByRole('textbox').textContent).to.equal(
          'mongodb://localhost:28099/?connectTimeoutMS=5000&serverSelectionTimeoutMS=5000'
        )
      );

      const connectButton = screen.getByText('Connect');
      fireEvent.click(connectButton);

      // Wait for the connecting... modal to be shown.
      await waitFor(
        () =>
          expect(screen.queryByTestId('cancel-connection-attempt-button')).to
            .exist
      );
    });

    afterEach(function () {
      cleanup();
    });

    describe('when the connection attempt is cancelled', function () {
      beforeEach(async function () {
        const cancelButton = screen.getByTestId(
          'cancel-connection-attempt-button'
        );
        fireEvent.click(cancelButton);

        // Wait for the connecting... modal to hide.
        await waitFor(
          () =>
            expect(screen.queryByTestId('cancel-connection-attempt-button')).to
              .not.exist
        );
      });

      it('should enable the connect button', function () {
        const connectButton = screen.getByText('Connect');
        expect(connectButton).to.not.match('disabled');
      });

      it('should not emit connected', function () {
        expect(onConnectedSpy.called).to.equal(false);
      });

      it('should have the disabled connect test id', function () {
        expect(screen.getByTestId('connections-disconnected')).to.be.visible;
      });

      describe('connecting to a successful connection after cancelling a connect', function () {
        beforeEach(async function () {
          const savedConnectionButton = screen.getByTestId(
            `saved-connection-button-${savedConnectableId}`
          );
          fireEvent.click(savedConnectionButton);

          // Wait for the connection to load in the form.
          await waitFor(() =>
            expect(screen.queryByRole('textbox').textContent).to.equal(
              'mongodb://localhost:27018/?readPreference=primary&ssl=false'
            )
          );

          const connectButton = screen.getByText('Connect');
          fireEvent.click(connectButton);

          await waitFor(
            () => expect(screen.queryByTestId('connections-connected')).to.exist
          );
        });

        afterEach(async function () {
          await onConnectedSpy.firstCall?.args[1]
            .disconnect()
            .catch(console.log);
        });

        it('should call onConnected once', function () {
          expect(onConnectedSpy.callCount).to.equal(1);
        });

        it('should emit the connection configuration used to connect', function () {
          expect(onConnectedSpy.firstCall.args[0]).to.deep.equal({
            id: savedConnectableId,
            connectionOptions: {
              connectionString:
                'mongodb://localhost:27018/?readPreference=primary&ssl=false',
            },
          });
        });

        it('should emit the data service', function () {
          expect(onConnectedSpy.firstCall.args[1].isWritable).to.not.equal(
            undefined
          );
        });
      });
    });
  });
});
