import { expect } from 'chai';
import { Binary, UUID } from 'bson';
import { MessageChannel } from 'node:worker_threads';
import { decodeConnectParams, encodeConnectParams } from './connect-params';
import type { ToolsConnectParams } from '../../tools-connection-manager';

describe('connect params over the port', function () {
  let channel: MessageChannel;

  beforeEach(function () {
    channel = new MessageChannel();
  });

  afterEach(function () {
    // Open ports keep the event loop alive and would stop the suite exiting
    channel.port1.close();
    channel.port2.close();
  });

  const connectParamsWithBson = (): ToolsConnectParams => ({
    connectionId: 'c1',
    connectionString: 'mongodb://localhost:27017',
    connectOptions: {
      productName: 'test',
      productDocsLink: 'http://example.com/docs',
      autoEncryption: {
        keyVaultNamespace: 'encryption.__keyVault',
        encryptedFieldsMap: {
          'hr.employees': {
            fields: [
              {
                path: 'taxid',
                keyId: new Binary(
                  Buffer.from('a21ddc6a880643849fdf8ba02a767b5f', 'hex'),
                  Binary.SUBTYPE_UUID
                ),
                bsonType: 'string',
              },
            ],
          },
        },
        kmsProviders: { local: { key: new UUID().toBinary() } },
      },
    },
  });

  it('keeps BSON values intact when passed through a MessagePort', async function () {
    // Structured cloning drops prototypes: this is the case the encoding
    // exists for, so it is asserted through a real port, not just the helpers.
    const received = new Promise<string>((resolve) => {
      // worker MessagePorts emit the value itself, unlike the EventTarget
      // shape `listen` handles
      channel.port2.on('message', (value: string) => resolve(value));
    });
    channel.port1.postMessage(encodeConnectParams(connectParamsWithBson()));

    const decoded = decodeConnectParams(await received);
    const { autoEncryption } = decoded.connectOptions as {
      autoEncryption?: {
        encryptedFieldsMap?: Record<string, { fields: { keyId: unknown }[] }>;
      };
    };
    const keyId =
      autoEncryption?.encryptedFieldsMap?.['hr.employees'].fields[0].keyId;

    expect(keyId).to.be.instanceOf(Binary);
    expect((keyId as Binary).buffer).to.deep.equal(
      Buffer.from('a21ddc6a880643849fdf8ba02a767b5f', 'hex')
    );
  });

  it('round-trips plain options unchanged', function () {
    const connectParams: ToolsConnectParams = {
      connectionId: 'c1',
      connectionString: 'mongodb://localhost:27017',
      connectOptions: {
        productName: 'test',
        productDocsLink: 'http://example.com/docs',
        serverSelectionTimeoutMS: 500,
      },
    };

    expect(
      decodeConnectParams(encodeConnectParams(connectParams))
    ).to.deep.equal(connectParams);
  });
});
