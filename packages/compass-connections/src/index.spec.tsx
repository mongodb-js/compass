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

const setInputValue = (testId: string, value: string) =>
  fireEvent.change(screen.getByTestId(testId), {
    target: { value },
  });

const setFileInputValue = (testId: string, value: string) =>
  fireEvent.change(screen.getByTestId(testId), {
    target: {
      files: [
        {
          path: value,
        },
      ],
    },
  });

describe.only('<Connections />', function () {
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
    beforeEach(async function () {
      if (process?.env?.COMPASS_CSFLE_SUPPORT !== 'true') {
        this.skip();
      }

      await openAdvancedTab('csfle');
      setInputValue('csfle-keyvault', 'db.coll');
    });

    it('passes the FLE options if csfle-keyvault is set', async function () {
      await expectToConnectWith({
        connectionString: 'mongodb://localhost:27017/?appName=Test+App',
        fleOptions: {
          storeCredentials: false,
          autoEncryption: { keyVaultNamespace: 'db.coll' },
        },
      });
    });

    it('reports an error if the key vault namespace is not set', async function () {
      setInputValue('csfle-keyvault', '');

      setEditorValue(
        screen.getByTestId('encrypted-fields-map-editor'),
        '{ "db.coll": { fields: [] } }'
      );

      await expectConnectionError(
        'Key Vault namespace must be specified for In-Use-Encryption-enabled connections'
      );
    });

    it('allows to set encrypted fields map', async function () {
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
              '$compass.error': null,
              '$compass.rawText': '{ "db.coll": { fields: [] } }',
              'db.coll': { fields: [] },
            },
          },
        },
      });
    });

    it('reports an error if the encrypted fields map is not well formed', async function () {
      setEditorValue(screen.getByTestId('encrypted-fields-map-editor'), '{');

      await expectConnectionError('EncryptedFieldConfig is invalid');
    });

    it('generates and uses a valid local random key', async function () {
      fireEvent.click(screen.getByText('Local KMS'));

      expect(screen.getByTestId('key').closest('input').value).to.equal('');

      fireEvent.click(screen.getByTestId('generate-local-key-button'));

      const generatedLocalKey = screen
        .getByTestId('key')
        .closest('input').value;

      expect(generatedLocalKey).to.match(/^[a-zA-Z0-9+/-_=]{128}$/);

      await expectToConnectWith({
        connectionString: 'mongodb://localhost:27017/?appName=Test+App',
        fleOptions: {
          storeCredentials: false,
          autoEncryption: {
            keyVaultNamespace: 'db.coll',
            kmsProviders: {
              local: {
                key: generatedLocalKey,
              },
            },
          },
        },
      });
    });

    it('allows to setup an AWS key store', async function () {
      fireEvent.click(screen.getByText('AWS'));

      setInputValue('accessKeyId', 'accessKeyId');
      setInputValue('secretAccessKey', 'secretAccessKey');
      setInputValue('sessionToken', 'sessionToken');
      setFileInputValue('tlsCAFile-input', 'my/ca/file.pem');
      setFileInputValue('tlsCertificateKeyFile-input', 'my/certkey/file.pem');

      await expectToConnectWith({
        connectionString: 'mongodb://localhost:27017/?appName=Test+App',
        fleOptions: {
          storeCredentials: false,
          autoEncryption: {
            keyVaultNamespace: 'db.coll',
            kmsProviders: {
              aws: {
                accessKeyId: 'accessKeyId',
                secretAccessKey: 'secretAccessKey',
                sessionToken: 'sessionToken',
              },
            },
            tlsOptions: {
              aws: {
                tlsCAFile: 'my/ca/file.pem',
                tlsCertificateKeyFile: 'my/certkey/file.pem',
              },
            },
          },
        },
      });
    });

    it('allows to setup a GCP key store', async function () {
      fireEvent.click(screen.getByText('GCP'));

      setInputValue('email', 'email');
      setInputValue('privateKey', 'privateKey');
      setInputValue('endpoint', 'endpoint');
      setFileInputValue('tlsCAFile-input', 'my/ca/file.pem');
      setFileInputValue('tlsCertificateKeyFile-input', 'my/certkey/file.pem');

      await expectToConnectWith({
        connectionString: 'mongodb://localhost:27017/?appName=Test+App',
        fleOptions: {
          storeCredentials: false,
          autoEncryption: {
            keyVaultNamespace: 'db.coll',
            kmsProviders: {
              gcp: {
                email: 'email',
                privateKey: 'privateKey',
                endpoint: 'endpoint',
              },
            },
            tlsOptions: {
              gcp: {
                tlsCAFile: 'my/ca/file.pem',
                tlsCertificateKeyFile: 'my/certkey/file.pem',
              },
            },
          },
        },
      });
    });
  });
});
