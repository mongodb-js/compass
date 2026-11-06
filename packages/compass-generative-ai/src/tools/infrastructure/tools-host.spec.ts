import { MessageChannel } from 'node:worker_threads';
import { expect } from 'chai';
import sinon from 'sinon';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { Logger } from '@mongodb-js/compass-logging';
import { DeviceId } from '@mongodb-js/mcp-tools-mongodb';
import { ApiClient } from '@mongodb-js/mcp-atlas-api-client';
import type { ITelemetry } from '@mongodb-js/mcp-types';
import { NodeDriverServiceProvider } from '@mongosh/service-provider-node-driver';
import type { CompassMcpTelemetry } from '../../compass-mcp-telemetry';
import { createRuntimeClient } from './runtime-client';
import { encodeConnectParams } from './connect-params';
import { ToolsHost } from './tools-host';
import type { ToolDefinitionInfo } from './tools-host';

describe('ToolsHost', function () {
  // The MCP server starts synchronously enough for the in-memory runner, but
  // registering the tools and the JSON Schema conversion give it some slack.
  this.timeout(10_000);

  let channel: MessageChannel;
  let host: ToolsHost;
  let logger: Logger;

  // worker_threads ports are structurally identical to DOM MessagePorts but
  // not nominally, so tests bridge them with this cast.
  const asRendererPort = (port: MessageChannel['port1']): MessagePort =>
    port as unknown as MessagePort;

  beforeEach(function () {
    channel = new MessageChannel();
    logger = createNoopLogger();
    host = new ToolsHost(asRendererPort(channel.port2), {
      logger,
    });
  });

  afterEach(async function () {
    await host.stop();
    channel.port1.close();
    channel.port2.close();
    sinon.restore();
  });

  it('lists read-only database tools as JSON Schema', async function () {
    const client = createRuntimeClient(asRendererPort(channel.port1));
    const tools = (await client.call(
      'listDatabaseTools'
    )) as ToolDefinitionInfo[];

    const names = tools.map((t) => t.name).sort();
    expect(names).to.include('find');
    expect(names).to.include('aggregate');
    expect(names).to.not.include('connect');
    for (const tool of tools) {
      expect(tool.description).to.be.a('string');
      expect(tool.inputSchema).to.have.property('type', 'object');
    }
  });

  it('does not expose the connection handle to the model', async function () {
    const client = createRuntimeClient(asRendererPort(channel.port1));
    const tools = (await client.call(
      'listDatabaseTools'
    )) as ToolDefinitionInfo[];

    for (const tool of tools) {
      const properties = (tool.inputSchema as any).properties ?? {};
      expect(Object.keys(properties)).to.not.include('connectionId');
    }
  });

  it('returns an error result when the connection fails', async function () {
    const client = createRuntimeClient(asRendererPort(channel.port1));
    // nothing is listening on this port, so connecting fails and the MCP
    // server surfaces that as an error result, not a rejection
    const result = (await client.call('performToolCall', {
      toolName: 'find',
      toolArgs: { database: 'test', collection: 'coll' },
      connectParams: encodeConnectParams({
        connectionId: 'c1',
        connectionString: 'mongodb://localhost:27019',
        connectOptions: {
          productName: 'test',
          productDocsLink: 'http://example.com/docs',
          // Fail fast when nothing is listening: the driver's default server
          // selection timeout (30s) would outlive this suite's timeout.
          serverSelectionTimeoutMS: 500,
        },
      }),
    })) as { content: unknown[]; isError?: boolean };

    expect(result).to.be.an('object');
    expect(result.isError).to.equal(true);
  });

  it('applies setUserConfig to the server config', async function () {
    const client = createRuntimeClient(asRendererPort(channel.port1));
    await client.call('setUserConfig', {
      enableMCPTelemetry: true,
      maxTimeMS: 1000,
    });
    await client.call('listDatabaseTools');

    expect((host as any).enableMCPTelemetry).to.equal(true);
    expect((host as any).maxTimeMS).to.equal(1000);
    expect((host as any).connectionManager.getMaxTimeMS()).to.equal(1000);
  });

  it('uses the Atlas base URL passed by the renderer for telemetry', async function () {
    const client = createRuntimeClient(asRendererPort(channel.port1));
    await client.call('setUserConfig', {
      enableMCPTelemetry: false,
      atlasBaseUrl: 'https://cloud-dev.mongodb.com',
    });
    await client.call('listDatabaseTools');

    expect((host as any).telemetry.apiClient.options.baseUrl).to.equal(
      'https://cloud-dev.mongodb.com'
    );
  });

  it('defaults the telemetry base URL to production', async function () {
    const client = createRuntimeClient(asRendererPort(channel.port1));
    await client.call('listDatabaseTools');

    expect((host as any).telemetry.apiClient.options.baseUrl).to.equal(
      'https://cloud.mongodb.com/'
    );
  });

  it('releases the server and the connection when stopped', async function () {
    const client = createRuntimeClient(asRendererPort(channel.port1));
    await client.call('listDatabaseTools');
    const connectionManager = (host as any).connectionManager;
    const disconnect = sinon.spy(connectionManager, 'disconnect');

    await host.stop();

    expect(disconnect).to.have.been.called;
    const settled = await Promise.race([
      client
        .call('listDatabaseTools')
        .then(() => 'answered')
        .catch(() => 'rejected'),
      new Promise((resolve) => setTimeout(() => resolve('pending'), 100)),
    ]);
    expect(settled).to.equal('pending');
  });

  describe('telemetry', function () {
    let createDeviceId: sinon.SinonStub;
    let sendEvents: sinon.SinonStub;

    const emitEvent = () => {
      ((host as any).telemetry as ITelemetry | undefined)?.emitEvents([
        {
          timestamp: new Date().toISOString(),
          source: 'mdbmcp',
          properties: {},
        },
      ]);
    };

    // Telemetry is fire-and-forget and only drains on close or the timer, so wait.
    const waitForSend = async () => {
      const deadline = Date.now() + 2000;
      while (!sendEvents.called && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    };

    const startTelemetry = async (
      client: ReturnType<typeof createRuntimeClient>
    ) => {
      await client.call('listDatabaseTools');
      await client.call('setUserConfig', { enableMCPTelemetry: true });
    };

    beforeEach(function () {
      createDeviceId = sinon.stub(DeviceId, 'create').returns({
        get: sinon.stub().resolves('test-device-id'),
        close: sinon.stub(),
      } as any);
      sendEvents = sinon.stub(ApiClient.prototype, 'sendEvents').resolves();
    });

    it('stamps the Compass hosting mode on every event', async function () {
      const client = createRuntimeClient(asRendererPort(channel.port1));
      await startTelemetry(client);

      expect(
        ((host as any).telemetry as CompassMcpTelemetry).getCommonProperties()
      ).to.have.property('hosting_mode', 'compass');
    });

    it('resolves no device id while telemetry is disabled', async function () {
      const client = createRuntimeClient(asRendererPort(channel.port1));
      await client.call('listDatabaseTools');

      emitEvent();

      expect(createDeviceId.called).to.equal(false);
    });

    it('starts the pipeline on the first event once enabled', async function () {
      const client = createRuntimeClient(asRendererPort(channel.port1));
      await startTelemetry(client);

      emitEvent();

      expect(createDeviceId.calledOnce).to.equal(true);
    });

    it('reports the tool call to the Atlas API client', async function () {
      sinon.stub(NodeDriverServiceProvider, 'connect').resolves({
        close: sinon.stub().resolves(),
        initialDb: 'test',
        listDatabases: sinon.stub().resolves({
          databases: [{ name: 'admin', sizeOnDisk: 1024 }],
        }),
      } as any);
      const client = createRuntimeClient(asRendererPort(channel.port1));
      await startTelemetry(client);

      await client.call('performToolCall', {
        toolName: 'list-databases',
        toolArgs: {},
        connectParams: encodeConnectParams({
          connectionId: 'c1',
          connectionString: 'mongodb://localhost:27017',
          connectOptions: {} as any,
        }),
      });

      await host.stop();
      await waitForSend();

      expect(sendEvents.called).to.equal(true);
      const [events] = sendEvents.firstCall.args;
      expect(events[0].properties).to.include({
        command: 'list-databases',
        component: 'tool',
        category: 'mongodb',
        result: 'success',
        hosting_mode: 'compass',
      });
    });

    it('reports nothing while telemetry is disabled', async function () {
      sinon.stub(NodeDriverServiceProvider, 'connect').resolves({
        close: sinon.stub().resolves(),
        initialDb: 'test',
        listDatabases: sinon.stub().resolves({
          databases: [{ name: 'admin', sizeOnDisk: 1024 }],
        }),
      } as any);
      const client = createRuntimeClient(asRendererPort(channel.port1));
      await client.call('listDatabaseTools');

      await client.call('performToolCall', {
        toolName: 'list-databases',
        toolArgs: {},
        connectParams: encodeConnectParams({
          connectionId: 'c1',
          connectionString: 'mongodb://localhost:27017',
          connectOptions: {} as any,
        }),
      });

      await host.stop();
      await waitForSend();

      expect(sendEvents.called).to.equal(false);
    });
  });
});
