import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';

import type { ConnectionOptions } from 'mongodb-data-service';
import { setCodemirrorEditorValue } from '@mongodb-js/compass-editor';
import { Binary } from 'bson';

import ConnectionForm from '../../../';
import { getNextKmsProviderName } from './kms-provider-content';
import { FileInputBackendProvider } from '@mongodb-js/compass-components';
import { createJSDomFileInputDummyBackend } from '@mongodb-js/compass-components/lib/components/file-input';

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

describe('In-Use Encryption', function () {
  let expectToConnectWith: (
    expected: ConnectionOptions | ((opts: ConnectionOptions) => void)
  ) => Promise<void>;
  let expectConnectionError: (expectedErrorText: string) => Promise<void>;

  beforeEach(async function () {
    const connectSpy = sinon.spy();

    expectToConnectWith = async (
      expected: ConnectionOptions | ((opts: ConnectionOptions) => void)
    ): Promise<void> => {
      connectSpy.resetHistory();
      fireEvent.click(screen.getByTestId('connect-button'));
      try {
        await waitFor(() => expect(connectSpy).to.have.been.calledOnce);
      } catch (e) {
        const errors = screen.getByTestId(
          'connection-error-summary'
        ).textContent;
        throw new Error(`connect was not called: errors = ${errors ?? ''}`);
      }

      if (typeof expected === 'function') {
        expected(connectSpy.getCall(0).args[0]);
      } else {
        expect(connectSpy.getCall(0).args[0]).to.be.deep.equal(expected);
      }
    };

    expectConnectionError = async (expectedErrorText: string) => {
      fireEvent.click(screen.getByTestId('connect-button'));
      await waitFor(() => screen.getByTestId('connection-error-summary'));
      expect(
        screen.getByTestId('connection-error-summary').textContent
      ).to.contain(expectedErrorText);
    };

    render(
      <FileInputBackendProvider
        createFileInputBackend={createJSDomFileInputDummyBackend()}
      >
        <ConnectionForm
          initialConnectionInfo={{
            id: 'conn-1',
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          }}
          onSaveAndConnectClicked={(connectionInfo) => {
            connectSpy(connectionInfo.connectionOptions);
          }}
          onSaveClicked={() => {
            return Promise.resolve();
          }}
        />
      </FileInputBackendProvider>
    );

    expect(connectSpy).not.to.have.been.called;

    await openAdvancedTab('csfle');
    setInputValue('csfle-keyvault', 'db.coll');
  });

  afterEach(cleanup);

  it('passes the FLE options if csfle-keyvault is set', async function () {
    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017',
      fleOptions: {
        storeCredentials: false,
        autoEncryption: { keyVaultNamespace: 'db.coll' },
      },
    });
  });

  it('sets storeCredentials', async function () {
    fireEvent.click(screen.getByTestId('csfle-store-credentials-input'));

    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017',
      fleOptions: {
        storeCredentials: true,
        autoEncryption: { keyVaultNamespace: 'db.coll' },
      },
    });
  });

  it('reports an error if the key vault namespace is not set', async function () {
    setInputValue('csfle-keyvault', '');

    await setCodemirrorEditorValue(
      screen.getByTestId('encrypted-fields-map-editor'),
      '{ "db.coll": { fields: [] } }'
    );

    await expectConnectionError(
      'Key Vault namespace must be specified for In-Use-Encryption-enabled connections'
    );
  });

  it('allows to set encrypted fields map', async function () {
    await setCodemirrorEditorValue(
      screen.getByTestId('encrypted-fields-map-editor'),
      '{ "db.coll": { fields: [{path: "foo", bsonType: "string", keyId: UUID("11d58b8a-0c6c-4d69-a0bd-70c6d9befae9") }] } }'
    );

    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017',
      fleOptions: {
        storeCredentials: false,
        autoEncryption: {
          keyVaultNamespace: 'db.coll',
          encryptedFieldsMap: {
            '$compass.error': null,
            '$compass.rawText':
              '{ "db.coll": { fields: [{path: "foo", bsonType: "string", keyId: UUID("11d58b8a-0c6c-4d69-a0bd-70c6d9befae9") }] } }',
            'db.coll': {
              fields: [
                {
                  bsonType: 'string',
                  keyId: new Binary(
                    Buffer.from('11d58b8a0c6c4d69a0bd70c6d9befae9', 'hex'),
                    4
                  ),
                  path: 'foo',
                },
              ],
            },
          },
        },
      },
    });
  });

  it('reports an error if the encrypted fields map is not well formed', async function () {
    await setCodemirrorEditorValue(
      screen.getByTestId('encrypted-fields-map-editor'),
      '{'
    );

    await expectConnectionError('EncryptedFieldConfig is invalid');
  });

  it('generates and uses a valid local random key', async function () {
    fireEvent.click(screen.getByText('Local KMS'));

    expect(
      screen.getByTestId('csfle-kms-local-key').closest('input')?.value
    ).to.equal('');

    fireEvent.click(screen.getByTestId('generate-local-key-button'));

    const generatedLocalKey = screen
      .getByTestId('csfle-kms-local-key')
      .closest('input')?.value;

    if (!generatedLocalKey) {
      throw new Error('expected generatedLocalKey');
    }

    expect(generatedLocalKey).to.match(/^[a-zA-Z0-9+/-_=]{128}$/);

    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017',
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

    setInputValue('csfle-kms-aws-accessKeyId', 'accessKeyId');
    setInputValue('csfle-kms-aws-secretAccessKey', 'secretAccessKey');
    setInputValue('csfle-kms-aws-sessionToken', 'sessionToken');
    setFileInputValue('tlsCAFile-input', 'my/ca/file.pem');
    setFileInputValue('tlsCertificateKeyFile-input', 'my/certkey/file.pem');
    setInputValue('tlsCertificateKeyFilePassword-input', 'password');

    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017',
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
              tlsCertificateKeyFilePassword: 'password',
            },
          },
        },
      },
    });
  });

  it('allows to setup a GCP key store', async function () {
    fireEvent.click(screen.getByText('GCP'));

    setInputValue('csfle-kms-gcp-email', 'email');
    setInputValue('csfle-kms-gcp-privateKey', 'privateKey');
    setInputValue('csfle-kms-gcp-endpoint', 'endpoint');
    setFileInputValue('tlsCAFile-input', 'my/ca/file.pem');
    setFileInputValue('tlsCertificateKeyFile-input', 'my/certkey/file.pem');
    setInputValue('tlsCertificateKeyFilePassword-input', 'password');

    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017',
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
              tlsCertificateKeyFilePassword: 'password',
            },
          },
        },
      },
    });
  });

  it('allows to setup an Azure key store', async function () {
    fireEvent.click(screen.getByText('Azure'));

    setInputValue('csfle-kms-azure-tenantId', 'tenantId');
    setInputValue('csfle-kms-azure-clientId', 'clientId');
    setInputValue('csfle-kms-azure-clientSecret', 'clientSecret');
    setInputValue(
      'csfle-kms-azure-identityPlatformEndpoint',
      'identityPlatformEndpoint'
    );
    setFileInputValue('tlsCAFile-input', 'my/ca/file.pem');
    setFileInputValue('tlsCertificateKeyFile-input', 'my/certkey/file.pem');
    setInputValue('tlsCertificateKeyFilePassword-input', 'password');

    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017',
      fleOptions: {
        storeCredentials: false,
        autoEncryption: {
          keyVaultNamespace: 'db.coll',
          kmsProviders: {
            azure: {
              tenantId: 'tenantId',
              clientId: 'clientId',
              clientSecret: 'clientSecret',
              identityPlatformEndpoint: 'identityPlatformEndpoint',
            },
          },
          tlsOptions: {
            azure: {
              tlsCAFile: 'my/ca/file.pem',
              tlsCertificateKeyFile: 'my/certkey/file.pem',
              tlsCertificateKeyFilePassword: 'password',
            },
          },
        },
      },
    });
  });

  it('allows to setup a KMIP key store', async function () {
    fireEvent.click(screen.getByText('KMIP'));

    setInputValue('csfle-kms-kmip-endpoint', 'endpoint:1000');
    setFileInputValue('tlsCAFile-input', 'my/ca/file.pem');
    setFileInputValue('tlsCertificateKeyFile-input', 'my/certkey/file.pem');
    setInputValue('tlsCertificateKeyFilePassword-input', 'password');

    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017',
      fleOptions: {
        storeCredentials: false,
        autoEncryption: {
          keyVaultNamespace: 'db.coll',
          kmsProviders: {
            kmip: {
              endpoint: 'endpoint:1000',
            },
          },
          tlsOptions: {
            kmip: {
              tlsCAFile: 'my/ca/file.pem',
              tlsCertificateKeyFile: 'my/certkey/file.pem',
              tlsCertificateKeyFilePassword: 'password',
            },
          },
        },
      },
    });
  });

  context('supports multiple kms providers from same type', function () {
    function renameKMSProvider(name: string, value: string) {
      const card = screen.getByTestId(`${name}-kms-card-item`);

      const editButton = within(card).queryByRole('button', {
        name: /edit kms provider name/i,
      });

      if (editButton) {
        userEvent.click(
          within(card).getByRole('button', {
            name: /edit kms provider name/i,
          })
        );
      }

      const selector = within(card).getByTestId('csfle-kms-card-name');
      userEvent.clear(selector);
      if (value !== '') {
        userEvent.type(selector, value);
      }
      userEvent.keyboard('{enter}');
    }

    it('allows to have multiple KMS providers from same type', async function () {
      fireEvent.click(screen.getByText('Local KMS'));
      fireEvent.click(screen.getByText('Add item'));

      const kmsProviders: Record<string, any> = {};

      for (const kmsProviderName of ['local', 'local:1'] as const) {
        const kmsCard = screen.getByTestId(`${kmsProviderName}-kms-card-item`);

        expect(
          within(kmsCard).getByTestId('csfle-kms-local-key').closest('input')
            ?.value
        ).to.equal('');

        fireEvent.click(
          within(kmsCard).getByTestId('generate-local-key-button')
        );

        const generatedLocalKey = within(kmsCard)
          .getByTestId('csfle-kms-local-key')
          .closest('input')?.value;

        if (!generatedLocalKey) {
          throw new Error('expected generatedLocalKey');
        }

        expect(generatedLocalKey).to.match(/^[a-zA-Z0-9+/-_=]{128}$/);

        kmsProviders[kmsProviderName] = {
          key: generatedLocalKey,
        };
      }

      await expectToConnectWith({
        connectionString: 'mongodb://localhost:27017',
        fleOptions: {
          storeCredentials: false,
          autoEncryption: {
            keyVaultNamespace: 'db.coll',
            kmsProviders,
          },
        },
      });
    });

    it('allows rename of KMS provider', async function () {
      fireEvent.click(screen.getByText('Local KMS'));
      fireEvent.click(screen.getByText('Add item'));

      renameKMSProvider('local', 'new_name_1');
      renameKMSProvider('local:1', 'new_name_2');

      const kmsProviders: Record<string, any> = {};

      for (const kmsProviderName of [
        'local:new_name_1',
        'local:new_name_2',
      ] as const) {
        const kmsCard = screen.getByTestId(`${kmsProviderName}-kms-card-item`);

        expect(
          within(kmsCard).getByTestId('csfle-kms-local-key').closest('input')
            ?.value
        ).to.equal('');

        fireEvent.click(
          within(kmsCard).getByTestId('generate-local-key-button')
        );

        const generatedLocalKey = within(kmsCard)
          .getByTestId('csfle-kms-local-key')
          .closest('input')?.value;

        if (!generatedLocalKey) {
          throw new Error('expected generatedLocalKey');
        }

        expect(generatedLocalKey).to.match(/^[a-zA-Z0-9+/-_=]{128}$/);

        kmsProviders[kmsProviderName] = {
          key: generatedLocalKey,
        };
      }

      await expectToConnectWith({
        connectionString: 'mongodb://localhost:27017',
        fleOptions: {
          storeCredentials: false,
          autoEncryption: {
            keyVaultNamespace: 'db.coll',
            kmsProviders,
          },
        },
      });
    });

    it('shows name validation errors', function () {
      fireEvent.click(screen.getByText('Local KMS'));
      fireEvent.click(screen.getByText('Add item'));

      // By default the first name is local

      // Check validation errors for the second name
      renameKMSProvider('local:1', '');
      expect(screen.getByText('Name cannot be empty')).to.exist;

      renameKMSProvider('local:1', 'local 1');
      expect(
        screen.getByText(
          'Name must be alphanumeric and may contain underscores'
        )
      ).to.exist;

      renameKMSProvider('local', 'name1');
      renameKMSProvider('local:1', 'name1');
      expect(screen.getByText('Name already exists')).to.exist;
    });

    it('allows user to remove a kms provider', function () {
      fireEvent.click(screen.getByText('Local KMS'));

      const card1 = screen.getByTestId('local-kms-card-item');
      userEvent.hover(card1);
      // When its only one card, we do not show the delete button
      expect(() =>
        within(card1).getByRole('button', {
          name: /Remove KMS provider/i,
        })
      ).to.throw;

      fireEvent.click(screen.getByText('Add item'));

      expect(within(card1).findByTestId('kms-card-header')).to.exist;
      expect(
        within(screen.getByTestId('local:1-kms-card-item')).findByTestId(
          'kms-card-header'
        )
      ).to.exist;

      // we show remove button on hover
      userEvent.hover(card1);
      fireEvent.click(
        within(card1).getByRole('button', {
          name: /Remove KMS provider/i,
        })
      );

      expect(() => card1).to.throw;
    });
  });

  it('getNextKmsProviderName', function () {
    const usecases = [
      {
        providerNames: [],
        expected: 'local',
      },
      {
        providerNames: ['local'],
        expected: 'local:1',
      },
      {
        providerNames: ['local:9'],
        expected: 'local:10',
      },
      {
        providerNames: ['local:what', 'local:this'],
        expected: 'local:1',
      },
    ];
    for (const { providerNames, expected } of usecases) {
      expect(getNextKmsProviderName('local', providerNames)).to.equal(expected);
    }
  });
});
