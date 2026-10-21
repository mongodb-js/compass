import { expect } from 'chai';
import { MessageChannel } from 'worker_threads';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { Logger } from '@mongodb-js/compass-logging';
import { createToolsRpcClient } from './rpc-client';
import { ToolsHost } from './tools-host';
import type { ToolDefinitionInfo } from './tools-host';

describe('ToolsHost', function () {
  // The MCP server starts synchronously enough for the in-memory runner, but
  // registering the tools and the JSON Schema conversion give it some slack.
  this.timeout(10_000);

  let channel: MessageChannel;
  let host: ToolsHost;
  let logger: Logger;

  beforeEach(function () {
    channel = new MessageChannel();
    logger = createNoopLogger();
    host = new ToolsHost(channel.port2, {
      logger,
    });
  });

  afterEach(function () {
    host.stop();
    channel.port1.close();
    channel.port2.close();
  });

  it('lists read-only database tools as JSON Schema', async function () {
    const client = createToolsRpcClient(channel.port1);
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

  it('returns an error result when the connection fails', async function () {
    const client = createToolsRpcClient(channel.port1);
    // nothing is listening on this port, so connecting fails and the MCP
    // server surfaces that as an error result, not a rejection
    const result = (await client.call('performToolCall', {
      toolName: 'find',
      toolArgs: { database: 'test', collection: 'coll' },
      connectParams: {
        connectionId: 'c1',
        connectionString: 'mongodb://localhost:27019',
        connectOptions: {},
      },
    })) as { content: unknown[]; isError?: boolean };

    expect(result).to.be.an('object');
    expect(result.isError).to.equal(true);
  });

  it('applies setUserConfig to the runner config', async function () {
    const client = createToolsRpcClient(channel.port1);
    await client.call('setUserConfig', {
      enableMCPTelemetry: true,
      maxTimeMS: 1000,
    });
    expect((host as any).runner.userConfig.telemetry).to.equal('enabled');
    expect((host as any).runner.userConfig.maxTimeMS).to.equal(1000);
  });
});
