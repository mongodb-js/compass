import sinon from 'sinon';
import { expect } from 'chai';
import { MessageChannel } from 'worker_threads';
import { ToolsController } from './tools-controller';
import type { ToolGroup } from './tools-controller';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { Logger } from '@mongodb-js/compass-logging';
import type { ToolsConnectParams } from './tools-connection-manager';
import { ToolsHost } from './tools/infrastructure/tools-host';
import {
  createSandboxFromDefaultPreferences,
  type PreferencesAccess,
} from '@mongodb-js/compass-preferences-model';
import type { AtlasAdminApiService } from '@mongodb-js/atlas-admin-api/provider';

describe('ToolsController', function () {
  // The MCP server starts in the utility host on the other end of the port;
  // starting it and registering tools is not instant.
  this.timeout(10_000);

  let sandbox: sinon.SinonSandbox;
  let logger: Logger;
  let toolsController: ToolsController;
  let getTelemetryAnonymousId: sinon.SinonStub;
  let preferences: PreferencesAccess;
  let atlasAdminApi: AtlasAdminApiService;

  const baseTools = ['atlas-connection-error-debugger'];

  // Every controller gets its own channel with a real ToolsHost on the other
  // end, so the tests exercise the whole rpc boundary.
  const openChannels: MessageChannel[] = [];
  const openHosts: ToolsHost[] = [];

  function createController(
    overrides: Partial<ConstructorParameters<typeof ToolsController>[0]> = {}
  ): ToolsController {
    const channel = new MessageChannel();
    const host = new ToolsHost(channel.port2, { logger });
    openChannels.push(channel);
    openHosts.push(host);
    return new ToolsController({
      enableMCPTelemetry: false,
      logger,
      getTelemetryAnonymousId,
      track: createNoopTrack(),
      preferences,
      atlasAdminApi,
      openPort: () => channel.port1,
      ...overrides,
    });
  }

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
    logger = createNoopLogger();
    getTelemetryAnonymousId = sandbox.stub().returns('test-anonymous-id');
    preferences = await createSandboxFromDefaultPreferences();
    atlasAdminApi = {} as AtlasAdminApiService;

    toolsController = createController();
  });

  afterEach(async function () {
    await toolsController.stopServer();
    for (const host of openHosts) {
      host.stop();
    }
    for (const channel of openChannels) {
      channel.port1.close();
      channel.port2.close();
    }
    openChannels.length = 0;
    openHosts.length = 0;
    sandbox.restore();
  });

  describe('constructor', function () {
    it('creates a ToolsController instance', function () {
      expect(toolsController).to.be.instanceOf(ToolsController);
    });

    it('initializes with empty tool groups', function () {
      const tools = toolsController.getActiveTools();
      expect(Object.keys(tools)).to.have.lengthOf(baseTools.length);
    });
  });

  describe('setActiveTools', function () {
    it('sets active tool groups', function () {
      const toolGroups = new Set<ToolGroup>(['querybar']);
      toolsController.setActiveTools(toolGroups);

      const tools = toolsController.getActiveTools();
      expect(tools).to.have.property('get-current-query');
    });

    it('updates active tool groups', function () {
      toolsController.setActiveTools(new Set(['querybar']));
      let tools = toolsController.getActiveTools();
      expect(tools).to.have.property('get-current-query');

      toolsController.setActiveTools(new Set(['aggregation-builder']));
      tools = toolsController.getActiveTools();
      expect(tools).to.not.have.property('get-current-query');
      expect(tools).to.have.property('get-current-pipeline');
    });

    it('can set multiple tool groups at once', function () {
      const toolGroups = new Set<ToolGroup>([
        'querybar',
        'aggregation-builder',
      ]);
      toolsController.setActiveTools(toolGroups);

      const tools = toolsController.getActiveTools();
      expect(tools).to.have.property('get-current-query');
      expect(tools).to.have.property('get-current-pipeline');
    });

    it('can clear active tool groups', function () {
      toolsController.setActiveTools(new Set(['querybar']));
      let tools = toolsController.getActiveTools();
      expect(tools).to.have.property('get-current-query');
      toolsController.setActiveTools(new Set([]));
      tools = toolsController.getActiveTools();
      expect(Object.keys(tools)).to.deep.equal(baseTools);
    });
  });

  describe('getActiveTools', function () {
    describe('atlas-connection-error-debugger tool', function () {
      it('is registered when the feature flag is enabled', function () {
        expect(toolsController.getActiveTools()).to.have.property(
          'atlas-connection-error-debugger'
        );
      });

      it('is not registered when Atlas sign in is not allowed', async function () {
        await preferences.savePreferences({
          enableAtlasConnectionErrorDebuggerTool: true,
          enableAtlasSignIn: false,
        });

        // The preference is derived from enableAtlasSignIn, so the tool is never
        // offered to the model when sign in is disabled for the organization
        expect(
          preferences.getPreferences().enableAtlasConnectionErrorDebuggerTool
        ).to.eq(false);
        expect(toolsController.getActiveTools()).to.not.have.property(
          'atlas-connection-error-debugger'
        );
      });
    });

    describe('querybar tools', function () {
      beforeEach(function () {
        toolsController.setActiveTools(new Set(['querybar']));
      });

      it('includes get-current-query tool when querybar is active', function () {
        const tools = toolsController.getActiveTools();
        expect(tools).to.have.property('get-current-query');
      });

      it('get-current-query has correct properties', function () {
        const tools = toolsController.getActiveTools();
        const queryTool = tools['get-current-query'];

        expect(queryTool).to.have.property('description');
        expect(queryTool.description).to.include('query');
        expect(queryTool).to.have.property('inputSchema');
        expect(queryTool).to.have.property('needsApproval', true);
        expect(queryTool).to.have.property('strict', false);
        expect(queryTool).to.have.property('execute');
      });

      it('get-current-query returns context query', async function () {
        const testQuery = '{ name: "test" }';
        toolsController.setContext({
          enableMCPTelemetry: false,
          query: testQuery,
          connections: [],
        });

        const tools = toolsController.getActiveTools();
        const result = await tools['get-current-query'].execute?.(
          {},
          {} as any
        );

        expect(result).to.deep.equal({ query: testQuery });
      });

      it('get-current-query returns undefined when no query in context', async function () {
        toolsController.setContext({
          enableMCPTelemetry: false,
          connections: [],
        });

        const tools = toolsController.getActiveTools();
        const result = await tools['get-current-query'].execute?.(
          {},
          {} as any
        );

        expect(result).to.deep.equal({ query: undefined });
      });
    });

    describe('aggregation-builder tools', function () {
      beforeEach(function () {
        toolsController.setActiveTools(new Set(['aggregation-builder']));
      });

      it('includes get-current-pipeline tool when aggregation-builder is active', function () {
        const tools = toolsController.getActiveTools();
        expect(tools).to.have.property('get-current-pipeline');
      });

      it('get-current-pipeline has correct properties', function () {
        const tools = toolsController.getActiveTools();
        const pipelineTool = tools['get-current-pipeline'];

        expect(pipelineTool).to.have.property('description');
        expect(pipelineTool.description).to.include('pipeline');
        expect(pipelineTool).to.have.property('inputSchema');
        expect(pipelineTool).to.have.property('needsApproval', true);
        expect(pipelineTool).to.have.property('strict', false);
        expect(pipelineTool).to.have.property('execute');
      });

      it('get-current-pipeline returns context pipeline', async function () {
        const testPipeline = '[{ $match: { status: "active" } }]';
        toolsController.setContext({
          enableMCPTelemetry: false,
          pipeline: testPipeline,
          connections: [],
        });

        const tools = toolsController.getActiveTools();
        const result = await tools['get-current-pipeline'].execute?.(
          {},
          {} as any
        );

        expect(result).to.deep.equal({ pipeline: testPipeline });
      });

      it('get-current-pipeline returns undefined when no pipeline in context', async function () {
        toolsController.setContext({
          enableMCPTelemetry: false,
          connections: [],
        });

        const tools = toolsController.getActiveTools();
        const result = await tools['get-current-pipeline'].execute?.(
          {},
          {} as any
        );

        expect(result).to.deep.equal({ pipeline: undefined });
      });
    });

    describe('db-read tools', function () {
      beforeEach(async function () {
        await toolsController.startServer();
        toolsController.setActiveTools(new Set(['db-read']));
      });

      it('ignores db tools if the server is not started', function () {
        const newController = createController();
        newController.setActiveTools(new Set(['db-read']));

        expect(Object.keys(newController.getActiveTools())).to.deep.equal(
          baseTools
        );
      });

      it('includes readonly database tools', function () {
        const tools = toolsController.getActiveTools();
        const readonlyToolNames = [
          'find',
          'aggregate',
          'count',
          'list-databases',
          'list-collections',
          'collection-indexes',
          'collection-schema',
          'explain',
          'collection-storage-size',
          'db-stats',
          'mongodb-logs',
        ];

        for (const toolName of readonlyToolNames) {
          expect(tools, toolName).to.have.property(toolName);
        }
      });

      it('does not include non-readonly tools', function () {
        const tools = toolsController.getActiveTools();
        // These tools should not be included even if they exist in the MCP server
        expect(tools).to.not.have.property('insert-many');
        expect(tools).to.not.have.property('delete-many');
        expect(tools).to.not.have.property('update-many');
      });

      it('database tools have needsApproval property', function () {
        const tools = toolsController.getActiveTools();
        const listDatabasesTool = tools['list-databases'];

        expect(listDatabasesTool).to.have.property('needsApproval', true);
      });

      it('collection-schema tool has a custom description that instructs the model to use it before queries and aggregations', function () {
        const tools = toolsController.getActiveTools();
        const tool = tools['collection-schema'];
        expect(tool.description).to.include(
          'Always use this tool to access collection schema information whenever asked to generate queries or aggregations and before performing queries or aggregations.'
        );
      });

      it('find tool has a custom description that instructs the model to use collection-schema first', function () {
        const tools = toolsController.getActiveTools();
        const tool = tools['find'];
        expect(tool.description).to.include(
          'Always use the collection-schema tool to access collection schema information before using this tool to perform queries.'
        );
      });

      it('aggregate tool has a custom description that instructs the model to use collection-schema first', function () {
        const tools = toolsController.getActiveTools();
        const tool = tools['aggregate'];
        expect(tool.description).to.include(
          'Always use the collection-schema tool to access collection schema information before using this tool to perform aggregations.'
        );
      });
    });

    describe('no active tools', function () {
      it('returns only base tools when no tool groups are set', function () {
        const tools = toolsController.getActiveTools();
        expect(Object.keys(tools)).to.have.lengthOf(baseTools.length);
      });
    });
  });

  describe('setContext', function () {
    it('sets context with query', async function () {
      const query = '{ status: "active" }';
      toolsController.setContext({
        enableMCPTelemetry: false,
        query,
        connections: [],
      });

      toolsController.setActiveTools(new Set(['querybar']));
      const tools = toolsController.getActiveTools();

      const result = await tools['get-current-query'].execute?.({}, {} as any);
      expect(result.query).to.equal(query);
    });

    it('sets context with pipeline', async function () {
      const pipeline = '[{ $match: { age: { $gte: 18 } } }]';
      toolsController.setContext({
        enableMCPTelemetry: false,
        pipeline,
        connections: [],
      });

      toolsController.setActiveTools(new Set(['aggregation-builder']));
      const tools = toolsController.getActiveTools();

      const result = await tools['get-current-pipeline'].execute?.(
        {},
        {} as any
      );
      expect(result.pipeline).to.equal(pipeline);
    });

    it('sets context with connections', function () {
      const connections: ToolsConnectParams[] = [
        {
          connectionId: 'conn-1',
          connectionString: 'mongodb://localhost:27017',
          connectOptions: {} as any,
        },
      ];

      toolsController.setContext({
        enableMCPTelemetry: false,
        connections,
      });

      // Context is set internally, verify through tool execution
      expect(() =>
        toolsController.setContext({
          enableMCPTelemetry: false,
          connections,
        })
      ).to.not.throw();
    });

    it('updates existing context', async function () {
      toolsController.setContext({
        enableMCPTelemetry: false,
        query: 'old query',
        connections: [],
      });

      toolsController.setContext({
        enableMCPTelemetry: false,
        query: 'new query',
        connections: [],
      });

      toolsController.setActiveTools(new Set(['querybar']));
      const tools = toolsController.getActiveTools();

      const result = await tools['get-current-query'].execute?.({}, {} as any);
      expect(result.query).to.equal('new query');
    });

    it('syncs telemetry setting with the utility host runner', async function () {
      await toolsController.startServer();
      const runner = (openHosts[0] as any).runner;

      toolsController.setContext({
        enableMCPTelemetry: true,
        connections: [],
      });
      // give the rpc call a moment to land
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(runner.userConfig.telemetry).to.equal('enabled');

      toolsController.setContext({
        enableMCPTelemetry: false,
        connections: [],
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(runner.userConfig.telemetry).to.equal('disabled');
    });

    it('syncs maxTimeMS setting with the utility host runner', async function () {
      await toolsController.startServer();
      const runner = (openHosts[0] as any).runner;

      toolsController.setContext({
        enableMCPTelemetry: false,
        maxTimeMS: 5000,
        connections: [],
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(runner.userConfig.maxTimeMS).to.equal(5000);

      toolsController.setContext({
        enableMCPTelemetry: false,
        maxTimeMS: undefined,
        connections: [],
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(runner.userConfig.maxTimeMS).to.equal(undefined);
    });
  });

  describe('setConnectionIdForToolCall', function () {
    it('sets connection ID for a tool call', function () {
      toolsController.setConnectionIdForToolCall({
        toolCallId: 'tool-call-1',
        connectionId: 'conn-1',
      });

      // Internal state is set, verify no errors
      expect(() =>
        toolsController.setConnectionIdForToolCall({
          toolCallId: 'tool-call-1',
          connectionId: 'conn-1',
        })
      ).to.not.throw();
    });

    it('sets null connection ID for a tool call', function () {
      toolsController.setConnectionIdForToolCall({
        toolCallId: 'tool-call-1',
        connectionId: null,
      });

      expect(() =>
        toolsController.setConnectionIdForToolCall({
          toolCallId: 'tool-call-1',
          connectionId: null,
        })
      ).to.not.throw();
    });
  });

  describe('server lifecycle', function () {
    describe('startServer', function () {
      it('fetches the db tool definitions from the utility host', async function () {
        await toolsController.startServer();
        toolsController.setActiveTools(new Set(['db-read']));

        expect(toolsController.getActiveTools()).to.have.property('find');
      });

      it('does not open a second port if already started', async function () {
        const openPort = sandbox.stub().returns(openChannels[0].port1);
        const controller = createController({ openPort });

        await controller.startServer();
        await controller.startServer();

        expect(openPort.calledOnce).to.be.true;
      });

      it('logs when server starts successfully', async function () {
        const logStub = sandbox.stub(logger.log, 'info');

        await toolsController.startServer();

        // make them numbers for easy comparison
        for (const args of logStub.args) {
          (args[0] as any) = args[0].__value;
        }

        expect(
          logStub.calledWith(
            sinon.match.number,
            'ToolsController',
            'Assistant tools utility process client started successfully'
          )
        ).to.be.true;
      });

      it('handles errors during server startup gracefully', async function () {
        const errorController = createController({
          getTelemetryAnonymousId: () => {
            throw new Error('Telemetry error');
          },
        });

        // Should not throw even if there's an error
        await errorController.startServer();
        // don't hang
        await errorController.stopServer();
      });
    });

    describe('stopServer', function () {
      it('stops the MCP server', async function () {
        await toolsController.startServer();

        await toolsController.stopServer();

        // Server should be cleaned up
        expect(() => toolsController.stopServer()).to.not.throw();
      });

      it('drops the db tools after stopping', async function () {
        await toolsController.startServer();
        toolsController.setActiveTools(new Set(['db-read']));
        expect(toolsController.getActiveTools()).to.have.property('find');

        await toolsController.stopServer();
        expect(Object.keys(toolsController.getActiveTools())).to.deep.equal(
          baseTools
        );
      });

      it('handles stop when server is not running', async function () {
        await toolsController.stopServer();

        // Should not throw
        expect(() => toolsController.stopServer()).to.not.throw();
      });

      it('logs when server stops successfully', async function () {
        await toolsController.startServer();
        const logStub = sandbox.stub(logger.log, 'info');

        await toolsController.stopServer();

        // make them numbers for easy comparison
        for (const args of logStub.args) {
          (args[0] as any) = args[0].__value;
        }

        expect(
          logStub.calledWith(
            sinon.match.number,
            'ToolsController',
            'MCP server stopped successfully'
          )
        ).to.be.true;
      });
    });
  });

  describe('integration scenarios', function () {
    it('can use multiple tool groups together', async function () {
      await toolsController.startServer();
      toolsController.setActiveTools(
        new Set(['querybar', 'aggregation-builder', 'db-read'])
      );

      const tools = toolsController.getActiveTools();

      expect(tools).to.have.property('get-current-query');
      expect(tools).to.have.property('get-current-pipeline');
      expect(tools).to.have.property('list-databases');
    });

    it('can switch between tool groups', async function () {
      await toolsController.startServer();

      toolsController.setActiveTools(new Set(['querybar']));
      let tools = toolsController.getActiveTools();
      expect(tools).to.have.property('get-current-query');
      expect(tools).to.not.have.property('list-databases');

      toolsController.setActiveTools(new Set(['db-read']));
      tools = toolsController.getActiveTools();
      expect(tools).to.not.have.property('get-current-query');
      expect(tools).to.have.property('list-databases');
    });

    it('context persists across tool group changes', async function () {
      const query = '{ test: 1 }';
      toolsController.setContext({
        enableMCPTelemetry: false,
        query,
        connections: [],
      });

      toolsController.setActiveTools(new Set(['querybar']));
      toolsController.setActiveTools(new Set(['aggregation-builder']));
      toolsController.setActiveTools(new Set(['querybar']));

      const tools = toolsController.getActiveTools();
      const result = await tools['get-current-query'].execute?.({}, {} as any);

      expect(result.query).to.equal(query);
    });
  });

  describe('error handling in db-read tools', function () {
    beforeEach(async function () {
      await toolsController.startServer();
      toolsController.setActiveTools(new Set(['db-read']));
    });

    it('throws error when connection ID is not found for tool call', async function () {
      const tools = toolsController.getActiveTools();
      const listDatabasesTool = tools['list-databases'];

      try {
        await listDatabasesTool.execute?.({}, {
          toolCallId: 'missing-id',
        } as any);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include("Can't find connection for tool call");
      }
    });

    it('throws error when connection is not in context', async function () {
      toolsController.setConnectionIdForToolCall({
        toolCallId: 'test-call',
        connectionId: 'missing-conn',
      });

      toolsController.setContext({
        enableMCPTelemetry: false,
        connections: [],
      });

      const tools = toolsController.getActiveTools();
      const listDatabasesTool = tools['list-databases'];

      try {
        await listDatabasesTool.execute?.({}, {
          toolCallId: 'test-call',
        } as any);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include(
          'No active connection to execute tool'
        );
      }
    });
  });
});
