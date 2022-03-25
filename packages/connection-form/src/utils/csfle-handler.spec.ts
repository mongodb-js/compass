import { expect } from 'chai';
import type { ConnectionOptions } from 'mongodb-data-service';

import {
  handleUpdateCsfleKmsParam,
  handleUpdateCsfleParam,
  handleUpdateCsfleKmsTlsParam,
  hasAnyCsfleOption,
} from './csfle-handler';

describe.only('csfle-handler', function () {
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
          kms: 'aws',
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
            kms: 'aws',
            key: 'accessKeyId',
          },
          connectionOptions: withParameterSet,
        }).connectionOptions.fleOptions
      ).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: {
            aws: undefined,
          },
        },
      });
    });
  });

  describe('#handleUpdateCsfleKmsTlsParam', function () {
    it('can set and delete a CSFLE TLS KMS parameter', function () {
      const withParameterSet = handleUpdateCsfleKmsTlsParam({
        action: {
          type: 'update-csfle-kms-tls-param',
          kms: 'aws',
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
            kms: 'aws',
            key: 'tlsCertificateKeyFilePassword',
          },
          connectionOptions: withParameterSet,
        }).connectionOptions.fleOptions
      ).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          tlsOptions: {
            aws: undefined,
          },
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
});
