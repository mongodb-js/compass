// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TestBackend } = require('storage-mixin');
// ^^ TODO: Try import and see bug.

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuid } from 'uuid';
import { convertConnectionInfoToModel } from 'mongodb-data-service';
import AppRegistry from 'hadron-app-registry';
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
  let tmpDir: string;
  let testAppRegistry: AppRegistry;
  let appRegistryEmitSpy;

  beforeEach(function () {
    testAppRegistry = new AppRegistry();
    appRegistryEmitSpy = sinon.spy();

    sinon.replace(testAppRegistry, 'emit', appRegistryEmitSpy);

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'connections-tests'));
    TestBackend.enable(tmpDir);
  });

  afterEach(function () {
    sinon.restore();

    TestBackend.disable();
    fs.rmdirSync(tmpDir, { recursive: true });
  });

  describe('when rendered', function () {
    beforeEach(function () {
      render(<Connections appRegistry={testAppRegistry} />);
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

    beforeEach(async function () {
      savedConnectionId = uuid();
      writeFakeConnection(tmpDir, {
        _id: savedConnectionId,
        port: 27018,
      });

      render(<Connections appRegistry={testAppRegistry} />);

      await waitFor(() => expect(screen.getByRole('listitem')).to.be.visible);
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

    describe('when the saved connection is clicked on', function () {
      beforeEach(async function () {
        const savedConnectionButton = screen.getByTestId(
          `saved-connection-button-${savedConnectionId}`
        );
        fireEvent.click(savedConnectionButton);

        // Wait for the connection to load in the form.
        await waitFor(() =>
          expect(screen.getByRole('textbox').textContent).to.equal(
            'mongodb://localhost:27018/?readPreference=primary&ssl=false'
          )
        );
      });

      describe('when connect is clicked', function () {
        beforeEach(async function () {
          expect(appRegistryEmitSpy.called).to.equal(false);

          const connectButton = screen.getByText('Connect');
          fireEvent.click(connectButton);

          await waitFor(
            () =>
              expect(screen.getByTestId('connections-connected')).to.be.visible
          );
        });

        afterEach(async function () {
          await appRegistryEmitSpy.firstCall.args[2]
            .disconnect()
            .catch(console.log);
        });

        it('should connect and emit connected', function () {
          expect(appRegistryEmitSpy.called).to.equal(true);
          const appRegistryEmitCall = appRegistryEmitSpy.firstCall;
          expect(appRegistryEmitCall.args[0]).to.equal(
            'data-service-connected'
          );
        });

        it('should emit null for connection error', function () {
          expect(appRegistryEmitSpy.firstCall.args[1]).to.equal(null);
        });

        it('should emit the data service', function () {
          expect(appRegistryEmitSpy.firstCall.args[2].isWritable).to.not.equal(
            undefined
          );
        });

        it('should emit the connection configuration used to connect', function () {
          expect(appRegistryEmitSpy.firstCall.args[3]).to.deep.equal({
            id: savedConnectionId,
            connectionOptions: {
              connectionString:
                'mongodb://localhost:27018/?readPreference=primary&ssl=false',
            },
          });
        });

        it('should emit the legacy connection model used to connect', function () {
          expect(appRegistryEmitSpy.firstCall.args[4]._id).to.equal(
            savedConnectionId
          );
        });
      });
    });
  });
});
