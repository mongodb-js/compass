import { expect } from 'chai';
import { Binary, UUID } from 'bson';
import { MessageChannel } from 'node:worker_threads';
import { decodeConnectParams, encodeConnectParams } from './connect-params';
import type { ConnectParamsWire } from './connect-params';
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

  async function overThePort(wire: ConnectParamsWire) {
    const received = new Promise<ConnectParamsWire>((resolve) => {
      // worker MessagePorts emit the value itself, unlike the EventTarget
      // shape `listen` handles
      channel.port2.on('message', (value: ConnectParamsWire) => resolve(value));
    });
    channel.port1.postMessage(wire);
    return await received;
  }

  it('restores BSON values passed through a MessagePort', async function () {
    // Structured cloning keeps the values but drops their prototypes: this is
    // the case the encoding exists for, so it is asserted through a real port.
    const connectParams = {
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
                },
              ],
            },
          },
          kmsProviders: { local: { key: new UUID() } },
        },
      },
    } as unknown as ToolsConnectParams;

    const decoded = decodeConnectParams(
      await overThePort(encodeConnectParams(connectParams))
    );
    const autoEncryption = (
      decoded.connectOptions as {
        autoEncryption: {
          encryptedFieldsMap: Record<string, { fields: { keyId: unknown }[] }>;
          kmsProviders: { local: { key: unknown } };
        };
      }
    ).autoEncryption;

    const keyId = autoEncryption.encryptedFieldsMap['hr.employees'].fields[0]
      .keyId as Binary;
    expect(keyId).to.be.instanceOf(Binary);
    expect(keyId.buffer).to.deep.equal(
      Buffer.from('a21ddc6a880643849fdf8ba02a767b5f', 'hex')
    );
    // UUID extends Binary, so the more specific type has to win
    expect(autoEncryption.kmsProviders.local.key).to.be.instanceOf(UUID);
  });

  it('leaves non-BSON values alone', async function () {
    const connectParams: ToolsConnectParams = {
      connectionId: 'c1',
      connectionString: 'mongodb://localhost:27017',
      connectOptions: {
        productName: 'test',
        productDocsLink: 'http://example.com/docs',
        serverSelectionTimeoutMS: 500,
      },
    };

    const decoded = decodeConnectParams(
      await overThePort(encodeConnectParams(connectParams))
    );

    expect(decoded).to.deep.equal(connectParams);
  });
});
