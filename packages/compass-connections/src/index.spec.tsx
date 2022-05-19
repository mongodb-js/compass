import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';

import type { ConnectionOptions } from 'mongodb-data-service';
import { setEditorValue, ToastArea } from '@mongodb-js/compass-components';

import Connections from './';

const openAdvancedTab = async (
  tabId: 'general' | 'authentication' | 'tls' | 'proxy' | 'advanced' | 'csfle'
) => {
  fireEvent.click(screen.getByTestId('advanced-connection-options'));
  const tabTestId = `connection-${tabId}-tab`;
  await waitFor(() => screen.getAllByTestId(tabTestId));
  // NOTE: for some reason data-testids gets duplicated both in the
  // tab button and in the tab panel
  fireEvent.click(screen.getAllByTestId(tabTestId)[0]);
};

const fillTextInput = (testId: string, value: string) =>
  fireEvent.change(screen.getByTestId(testId), {
    target: { value },
  });

describe('<Connections />', function () {
  let expectToConnectWith;
  let expectConnectionError;

  beforeEach(function () {
    const connectSpy = sinon.spy();

    expectToConnectWith = async (
      expected: ConnectionOptions
    ): Promise<void> => {
      connectSpy.resetHistory();
      fireEvent.click(screen.getByTestId('connect-button'));
      await waitFor(() => expect(connectSpy).to.have.been.calledOnce);
      expect(connectSpy.getCall(0).args[0]).to.be.deep.equal(expected);
    };

    expectConnectionError = async (expectedErrorText: string) => {
      fireEvent.click(screen.getByTestId('connect-button'));
      await waitFor(() => screen.getByTestId('connection-error-summary'));
      console.log(screen.getByTestId('connection-error-summary').textContent);

      expect(
        screen.getByTestId('connection-error-summary').textContent
      ).to.contain(expectedErrorText);
    };

    render(
      <ToastArea>
        <Connections
          connectionStorage={
            {
              loadAll: () => Promise.resolve([]),
              save: () => Promise.resolve(),
              delete: () => Promise.resolve(),
              load: () => Promise.resolve(undefined),
            } as any
          }
          appName="Test App"
          connectFn={connectSpy}
          onConnected={() => {}}
        />
      </ToastArea>
    );

    expect(connectSpy).not.to.have.been.called;
  });

  afterEach(cleanup);

  it('connects to localhost by default', async function () {
    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017/?appName=Test+App',
    });
  });

  describe('In-Use Encryption', function () {
    beforeEach(function () {
      if (process?.env?.COMPASS_CSFLE_SUPPORT !== 'true') {
        this.skip();
      }
    });

    it('passes the FLE options if csfle-keyvault is set', async function () {
      await openAdvancedTab('csfle');
      fillTextInput('csfle-keyvault', 'db.coll');

      await expectToConnectWith({
        connectionString: 'mongodb://localhost:27017/?appName=Test+App',
        fleOptions: {
          storeCredentials: false,
          autoEncryption: { keyVaultNamespace: 'db.coll' },
        },
      });
    });

    it('allows to set encrypted fields map', async function () {
      await openAdvancedTab('csfle');
      fillTextInput('csfle-keyvault', 'db.coll');

      setEditorValue(
        screen.getByTestId('encrypted-fields-map-editor'),
        '{ "db.coll": { fields: [] } }'
      );

      await expectToConnectWith({
        connectionString: 'mongodb://localhost:27017/?appName=Test+App',
        fleOptions: {
          storeCredentials: false,
          autoEncryption: {
            keyVaultNamespace: 'db.coll',
            encryptedFieldsMap: {
              '$compass.error': [null],
              '$compass.rawText': '{ "db.coll": { fields: [] } }',
              'db.coll': { fields: [] },
            },
          },
        },
      });
    });

    it('reports an error if the encrypted fields map is not well formed', async function () {
      await openAdvancedTab('csfle');
      fillTextInput('csfle-keyvault', 'db.coll');

      await expectConnectionError('bla');
    });
  });
});
