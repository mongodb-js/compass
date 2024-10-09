import { expect } from 'chai';
import { Binary } from 'mongodb';
import type { ConnectionOptions } from 'mongodb-data-service';

import {
  handleUpdateCsfleStoreCredentials,
  handleUpdateCsfleKmsParam,
  handleUpdateCsfleParam,
  handleUpdateCsfleKmsTlsParam,
  hasAnyCsfleOption,
  textToEncryptedFieldConfig,
  encryptedFieldConfigToText,
  adjustCSFLEParams,
  randomLocalKey,
  unsetFleOptionsIfEmptyAutoEncryption,
  handleAddKmsProvider,
  handleRenameKmsProvider,
  handleRemoveKmsProvider,
} from './csfle-handler';

describe('csfle-handler', function () {
  let connectionOptions: ConnectionOptions;

  beforeEach(function () {
    connectionOptions = {
      connectionString: 'mongodb://localhost/',
      fleOptions: {
        storeCredentials: false,
        autoEncryption: {},
      },
    };
  });

  describe('#handleUpdateCsfleStoreCredentials', function () {
    it('can set and unset a the CSFLE storeCredentials flag', function () {
      const withParameterSet = handleUpdateCsfleStoreCredentials({
        action: {
          type: 'update-csfle-store-credentials',
          value: true,
        },
        connectionOptions,
      }).connectionOptions;

      expect(withParameterSet.fleOptions).to.deep.equal({
        storeCredentials: true,
        autoEncryption: {},
      });

      expect(
        handleUpdateCsfleStoreCredentials({
          action: {
            type: 'update-csfle-store-credentials',
            value: false,
          },
          connectionOptions: withParameterSet,
        }).connectionOptions.fleOptions
      ).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {},
      });
    });
  });

  describe('#handleUpdateCsfleParam', function () {
    it('can set and delete a CSFLE parameter', function () {
      const withParameterSet = handleUpdateCsfleParam({
        action: {
          type: 'update-csfle-param',
          key: 'keyVaultNamespace',
          value: 'asdf.ghjk',
        },
        connectionOptions,
      }).connectionOptions;

      expect(withParameterSet.fleOptions).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          keyVaultNamespace: 'asdf.ghjk',
        },
      });

      expect(
        handleUpdateCsfleParam({
          action: {
            type: 'update-csfle-param',
            key: 'keyVaultNamespace',
          },
          connectionOptions: withParameterSet,
        }).connectionOptions.fleOptions
      ).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {},
      });
    });
  });

  describe('#handleUpdateCsfleKmsParam', function () {
    it('can set and delete a CSFLE KMS parameter', function () {
      const withParameterSet = handleUpdateCsfleKmsParam({
        action: {
          type: 'update-csfle-kms-param',
          kmsProviderName: 'aws',
          key: 'accessKeyId',
          value: '123456',
        },
        connectionOptions,
      }).connectionOptions;

      expect(withParameterSet.fleOptions).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: {
            aws: {
              accessKeyId: '123456',
            },
          },
        },
      });

      expect(
        handleUpdateCsfleKmsParam({
          action: {
            type: 'update-csfle-kms-param',
            kmsProviderName: 'aws',
            key: 'accessKeyId',
          },
          connectionOptions: withParameterSet,
        }).connectionOptions.fleOptions
      ).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: {},
        },
      });
    });
  });

  describe('#handleUpdateCsfleKmsTlsParam', function () {
    it('can set and delete a CSFLE TLS KMS parameter', function () {
      const withParameterSet = handleUpdateCsfleKmsTlsParam({
        action: {
          type: 'update-csfle-kms-tls-param',
          kmsProviderName: 'aws',
          key: 'tlsCertificateKeyFilePassword',
          value: '123456',
        },
        connectionOptions,
      }).connectionOptions;

      expect(withParameterSet.fleOptions).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          tlsOptions: {
            aws: {
              tlsCertificateKeyFilePassword: '123456',
            },
          },
        },
      });

      expect(
        handleUpdateCsfleKmsTlsParam({
          action: {
            type: 'update-csfle-kms-tls-param',
            kmsProviderName: 'aws',
            key: 'tlsCertificateKeyFilePassword',
          },
          connectionOptions: withParameterSet,
        }).connectionOptions.fleOptions
      ).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          tlsOptions: {},
        },
      });
    });
  });

  describe('#hasAnyCsfleOption', function () {
    it('detemines whether CSFLE options are set', function () {
      expect(hasAnyCsfleOption({})).to.equal(false);
      expect(
        hasAnyCsfleOption({
          keyVaultNamespace: 'asdf.ghjk',
        })
      ).to.equal(true);
      expect(
        hasAnyCsfleOption({
          tlsOptions: {},
          kmsProviders: {},
        })
      ).to.equal(false);
      expect(
        hasAnyCsfleOption({
          tlsOptions: { aws: {} },
          kmsProviders: { aws: {} } as any,
        })
      ).to.equal(false);
      expect(
        hasAnyCsfleOption({
          kmsProviders: {
            aws: {
              accessKeyId: 'accessKeyId',
              secretAccessKey: 'secretAccessKey ',
            },
          },
        })
      ).to.equal(true);
      expect(
        hasAnyCsfleOption({
          tlsOptions: { aws: { tlsCertificateKeyFilePassword: '1' } },
        })
      ).to.equal(true);
    });
  });

  describe('#handleAddKmsProvider', function () {
    it('can add a kms provider', function () {
      let withParameterSet = handleAddKmsProvider({
        action: {
          type: 'add-new-csfle-kms-provider',
          name: 'local',
        },
        connectionOptions,
      }).connectionOptions;

      expect(withParameterSet.fleOptions).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: {
            local: {},
          },
        },
      });

      withParameterSet = handleAddKmsProvider({
        action: {
          type: 'add-new-csfle-kms-provider',
          name: 'aws',
        },
        connectionOptions: withParameterSet,
      }).connectionOptions;

      expect(withParameterSet.fleOptions).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: {
            local: {},
            aws: {},
          },
        },
      });
    });
  });

  describe('#handleRenameCsfleParam', function () {
    it('can rename a kms provider name', function () {
      connectionOptions.fleOptions = {
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: {
            local: {
              key: 'asdf',
            },
          },
          tlsOptions: {
            local: {
              tlsCertificateKeyFilePassword: 'asdf',
            },
          },
        },
      };
      const withParameterSet = handleRenameKmsProvider({
        action: {
          type: 'rename-csfle-kms-provider',
          name: 'local',
          newName: 'local:1',
        },
        connectionOptions,
      }).connectionOptions;

      expect(withParameterSet.fleOptions).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: {
            'local:1': {
              key: 'asdf',
            },
          },
          tlsOptions: {
            'local:1': {
              tlsCertificateKeyFilePassword: 'asdf',
            },
          },
        },
      });
    });

    it('renames kms name and does not change the position of the key', function () {
      connectionOptions.fleOptions = {
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: {
            'local:2': {
              key: 'asdf',
            },
            local: {
              key: 'asdf',
            },
            'aws:1': {
              secretAccessKey: 'asdf',
              accessKeyId: 'asdf',
            },
          },
          tlsOptions: {
            'local:2': {
              tlsCertificateKeyFilePassword: 'asdf',
            },
            local: {
              tlsCertificateKeyFilePassword: 'asdf',
            },
            'aws:1': {
              tlsCertificateKeyFilePassword: 'asdf',
            },
          },
        },
      };
      const withParameterSet = handleRenameKmsProvider({
        action: {
          type: 'rename-csfle-kms-provider',
          name: 'local',
          newName: 'local:3',
        },
        connectionOptions,
      }).connectionOptions;

      expect(withParameterSet.fleOptions).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: {
            'local:2': {
              key: 'asdf',
            },
            'local:3': {
              key: 'asdf',
            },
            'aws:1': {
              secretAccessKey: 'asdf',
              accessKeyId: 'asdf',
            },
          },
          tlsOptions: {
            'local:2': {
              tlsCertificateKeyFilePassword: 'asdf',
            },
            'local:3': {
              tlsCertificateKeyFilePassword: 'asdf',
            },
            'aws:1': {
              tlsCertificateKeyFilePassword: 'asdf',
            },
          },
        },
      });
    });
  });

  describe('#handleRemoveKmsProvider', function () {
    it('can remove a kms provider', function () {
      connectionOptions.fleOptions = {
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: {
            local: {
              key: 'asdf',
            },
          },
          tlsOptions: {
            local: {
              tlsCertificateKeyFilePassword: 'asdf',
            },
          },
        },
      };
      const withParameterSet = handleRemoveKmsProvider({
        action: {
          type: 'remove-csfle-kms-provider',
          name: 'local',
        },
        connectionOptions,
      }).connectionOptions;

      expect(withParameterSet.fleOptions).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: {},
          tlsOptions: {},
        },
      });
    });
  });

  describe('#randomLocalKey', function () {
    it('returns random 96-byte base64-encoded strings', function () {
      expect(randomLocalKey()).to.match(/^[A-Za-z0-9+/]{128}$/);
      expect(randomLocalKey()).to.not.equal(randomLocalKey());
    });
  });

  describe('encryptedFieldConfig management', function () {
    const exampleString = `{
      'hr.employees': {
        bsonType: 'object',
        properties: {
          taxid: {
            encrypt: {
              keyId: [ UUID('a21ddc6a-8806-4384-9fdf-8ba02a767b5f') ],
              bsonType: 'string',
              algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
            }
          }
        }
      }
    }`;

    const exampleObject = {
      'hr.employees': {
        bsonType: 'object',
        properties: {
          taxid: {
            encrypt: {
              keyId: [
                new Binary(
                  Buffer.from('a21ddc6a880643849fdf8ba02a767b5f', 'hex'),
                  4
                ),
              ],
              bsonType: 'string',
              algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
            },
          },
        },
      },
    };

    describe('#textToEncryptedFieldConfig', function () {
      it('converts a shell BSON text to its BSON JS object representation', function () {
        // Single direction
        expect(textToEncryptedFieldConfig(exampleString)).to.deep.equal({
          ...exampleObject,
          '$compass.error': null,
          '$compass.rawText': exampleString,
        });

        // Round trip
        const obj = textToEncryptedFieldConfig(
          encryptedFieldConfigToText(exampleObject)
        );
        if (!obj) {
          throw new Error('expected obj');
        }
        expect(obj).to.deep.equal({
          ...exampleObject,
          '$compass.error': null,
          '$compass.rawText': obj['$compass.rawText'],
        });
      });

      it('records the error for invalid shell BSON text', function () {
        expect(textToEncryptedFieldConfig('{')).to.deep.equal({
          '$compass.error': 'Unexpected token (3:0)',
          '$compass.rawText': '{',
        });
      });

      it('records the error for parseable but invalid shell BSON text', function () {
        expect(textToEncryptedFieldConfig('asdf')).to.deep.equal({
          '$compass.error': 'Field contained invalid input',
          '$compass.rawText': 'asdf',
        });
      });

      it('converts an empty string to undefined', function () {
        expect(textToEncryptedFieldConfig('')).to.equal(undefined);
        expect(textToEncryptedFieldConfig('  ')).to.equal(undefined);
      });
    });

    describe('#encryptedFieldConfigToText', function () {
      it('converts a BSON JS object representation to shell BSON text', function () {
        const normalize = (s: string) =>
          s.replace(/\s+/g, ' ').replace(/-/g, '');
        // Single direction
        expect(normalize(encryptedFieldConfigToText(exampleObject))).to.equal(
          normalize(exampleString)
        );
        // Round trip
        expect(
          normalize(
            encryptedFieldConfigToText(
              textToEncryptedFieldConfig(exampleString)
            )
          )
        ).to.equal(normalize(exampleString));
      });

      it('converts undefined to an empty string', function () {
        expect(encryptedFieldConfigToText(undefined)).to.equal('');
      });
    });

    describe('#adjustCSFLEParams', function () {
      it('revives the encrypted field config', function () {
        const connectionOptions: ConnectionOptions = {
          connectionString: 'mongodb://localhost',
          fleOptions: {
            storeCredentials: false,
            autoEncryption: {
              schemaMap: {
                '$compass.rawText': exampleString,
                '$compass.error': null,
              },
              encryptedFieldsMap: {
                '$compass.rawText': exampleString,
                '$compass.error': null,
              },
            },
          },
        };
        expect(adjustCSFLEParams(connectionOptions)).to.deep.equal({
          ...connectionOptions,
          fleOptions: {
            storeCredentials: false,
            autoEncryption: {
              schemaMap: {
                ...exampleObject,
                '$compass.rawText': exampleString,
                '$compass.error': null,
              },
              encryptedFieldsMap: {
                ...exampleObject,
                '$compass.rawText': exampleString,
                '$compass.error': null,
              },
            },
          },
        });
      });
    });
  });

  describe('unsetFleOptionsIfEmptyAutoEncryption', function () {
    it('unsets fleOptions if options are empty', function () {
      (connectionOptions.fleOptions as any).autoEncryption = {
        kmsProviders: {
          aws: {},
          'aws:1': {},
        },
        tlsOptions: {
          local: {},
        },
      };
      expect(
        unsetFleOptionsIfEmptyAutoEncryption(connectionOptions)
      ).to.deep.equal({
        connectionString: 'mongodb://localhost/',
        fleOptions: undefined,
      });
    });
    it('does not unset fleOptions if options are not empty', function () {
      (connectionOptions.fleOptions as any).autoEncryption = {
        kmsProviders: {
          aws: {
            accessKeyId: 'asdf',
          },
          'aws:1': {},
        },
        tlsOptions: {
          local: {},
        },
      };
      expect(
        unsetFleOptionsIfEmptyAutoEncryption(connectionOptions)
      ).to.deep.equal({
        connectionString: 'mongodb://localhost/',
        fleOptions: {
          autoEncryption: {
            kmsProviders: {
              aws: {
                accessKeyId: 'asdf',
              },
            },
          },
          storeCredentials: false,
        },
      });
    });
  });
});
