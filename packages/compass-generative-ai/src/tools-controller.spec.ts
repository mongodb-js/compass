import sinon from 'sinon';
import { expect } from 'chai';
import { ToolsController } from './tools-controller';
import type { ToolGroup } from './tools-controller';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { Logger } from '@mongodb-js/compass-logging';
import type { ToolsConnectParams } from './tools-connection-manager';
import { READ_ONLY_DATABASE_TOOLS } from './available-tools';
import {
  createSandboxFromDefaultPreferences,
  type PreferencesAccess,
} from '@mongodb-js/compass-preferences-model';
import type { AtlasAdminApiService } from '@mongodb-js/atlas-admin-api/provider';
import { NodeDriverServiceProvider } from '@mongosh/service-provider-node-driver';
import { DeviceId } from '@mongodb-js/mcp-tools-mongodb';
import { ApiClient } from '@mongodb-js/mcp-atlas-api-client';
import type { ITelemetry } from '@mongodb-js/mcp-types';
import type { CompassMcpTelemetry } from './compass-mcp-telemetry';

describe('ToolsController', function () {
  let sandbox: sinon.SinonSandbox;
  let logger: Logger;
  let toolsController: ToolsController;
  let getTelemetryAnonymousId: sinon.SinonStub;
  let preferences: PreferencesAccess;
  let atlasAdminApi: AtlasAdminApiService;

  const baseTools = ['atlas-connection-error-debugger'];

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
    logger = createNoopLogger();
    getTelemetryAnonymousId = sandbox.stub().returns('test-anonymous-id');
    preferences = await createSandboxFromDefaultPreferences();
    atlasAdminApi = {} as AtlasAdminApiService;

    toolsController = new ToolsController({
      enableMCPTelemetry: false,
      logger,
      getTelemetryAnonymousId,
      track: createNoopTrack(),
      preferences,
      atlasAdminApi,
    });
  });

  afterEach(async function () {
    await toolsController.stopServer();
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

    it('server is initially undefined', function () {
      expect(toolsController.server).to.be.undefined;
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
        const newController = new ToolsController({
          enableMCPTelemetry: false,
          logger,
          getTelemetryAnonymousId,
          track: createNoopTrack(),
          preferences,
          atlasAdminApi,
        });
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
          expect(tools).to.have.property(toolName);
        }
      });

      it('ensures all read only database tools are retrievable from the server after initialization', function () {
        expect(toolsController.server).to.not.be.undefined;
        expect(toolsController.server?.tools).to.not.be.undefined;

        const serverTools = toolsController.server?.tools ?? [];
        const serverToolNames = serverTools.map((tool) => tool.name);

        for (const tool of READ_ONLY_DATABASE_TOOLS) {
          expect(
            serverToolNames,
            `Expected server to have tool: ${tool.name}`
          ).to.include(tool.name);
        }

        // Verify the count matches
        expect(
          serverToolNames.filter((name) =>
            READ_ONLY_DATABASE_TOOLS.map((t) => t.name).includes(name)
          ).length,
          'Expected all READ_ONLY_DATABASE_TOOLS to be in server tools'
        ).to.equal(READ_ONLY_DATABASE_TOOLS.length);
      });

      it('does not include non-readonly tools', function () {
        const tools = toolsController.getActiveTools();
        // These tools should not be included even if they exist in the MCP server
        expect(tools).to.not.have.property('insert-many');
        expect(tools).to.not.have.property('delete-many');
        expect(tools).to.not.have.property('update-many');
      });

      it('database tools have needsApproval and strict properties', function () {
        const tools = toolsController.getActiveTools();
        const listDatabasesTool = tools['list-databases'];

        expect(listDatabasesTool).to.have.property('needsApproval', true);
        expect(listDatabasesTool).to.have.property('strict', true);
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

    it('syncs maxTimeMS setting with the tools config', async function () {
      await toolsController.startServer();

      toolsController.setContext({
        enableMCPTelemetry: false,
        maxTimeMS: 5000,
        connections: [],
      });
      expect(toolsController.server?.config.maxTimeMS).to.equal(5000);

      toolsController.setContext({
        enableMCPTelemetry: false,
        maxTimeMS: undefined,
        connections: [],
      });
      expect(toolsController.server?.config.maxTimeMS).to.equal(undefined);
    });

    it('applies maxTimeMS set before the server starts', async function () {
      toolsController.setContext({
        enableMCPTelemetry: false,
        maxTimeMS: 5000,
        connections: [],
      });

      await toolsController.startServer();

      expect(toolsController.server?.config.maxTimeMS).to.equal(5000);
    });
  });

  describe('MCP telemetry', function () {
    let createDeviceId: sinon.SinonStub;

    beforeEach(function () {
      createDeviceId = sandbox.stub(DeviceId, 'create').returns({
        get: sandbox.stub().resolves('test-device-id'),
        close: sandbox.stub(),
      } as any);
    });

    const emitEvent = (telemetry: ITelemetry | undefined) => {
      telemetry?.emitEvents([
        {
          timestamp: new Date().toISOString(),
          source: 'mdbmcp',
          properties: {},
        } as any,
      ]);
    };

    it('syncs telemetry setting with the tools config', async function () {
      await toolsController.startServer();

      expect(toolsController.server?.telemetry.isTelemetryEnabled()).to.equal(
        false
      );

      toolsController.setContext({
        enableMCPTelemetry: true,
        connections: [],
      });
      expect(toolsController.server?.telemetry.isTelemetryEnabled()).to.equal(
        true
      );

      toolsController.setContext({
        enableMCPTelemetry: false,
        connections: [],
      });
      expect(toolsController.server?.telemetry.isTelemetryEnabled()).to.equal(
        false
      );
    });

    it('honours the preference set before the server starts', async function () {
      toolsController.setContext({
        enableMCPTelemetry: true,
        connections: [],
      });

      await toolsController.startServer();

      expect(toolsController.server?.telemetry.isTelemetryEnabled()).to.equal(
        true
      );
    });

    it('resolves no device id while telemetry is disabled', async function () {
      await toolsController.startServer();

      emitEvent(toolsController.server?.telemetry);

      expect(createDeviceId.called).to.equal(false);
    });

    it('starts the pipeline on the first event once enabled', async function () {
      await toolsController.startServer();
      toolsController.setContext({
        enableMCPTelemetry: true,
        connections: [],
      });

      emitEvent(toolsController.server?.telemetry);

      expect(createDeviceId.calledOnce).to.equal(true);
    });

    it('stamps the Compass hosting mode on every event', async function () {
      await toolsController.startServer();
      const telemetry = toolsController.server
        ?.telemetry as unknown as CompassMcpTelemetry;

      expect(telemetry.getCommonProperties()).to.have.property(
        'hosting_mode',
        'compass'
      );
    });

    describe('when a database tool runs', function () {
      let sendEvents: sinon.SinonStub;

      beforeEach(async function () {
        sendEvents = sandbox.stub(ApiClient.prototype, 'sendEvents').resolves();
        sandbox.stub(NodeDriverServiceProvider, 'connect').resolves({
          close: sandbox.stub().resolves(),
          initialDb: 'test',
          listDatabases: sandbox.stub().resolves({
            databases: [{ name: 'admin', sizeOnDisk: 1024 }],
          }),
        } as any);

        await toolsController.startServer();
        toolsController.setActiveTools(new Set(['db-read']));
        toolsController.setConnectionIdForToolCall({
          toolCallId: 'call-1',
          connectionId: 'conn-1',
        });
      });

      const setTelemetryEnabled = (enableMCPTelemetry: boolean) => {
        toolsController.setContext({
          enableMCPTelemetry,
          connections: [
            {
              connectionId: 'conn-1',
              connectionString: 'mongodb://localhost:27017',
              connectOptions: {} as any,
            },
          ],
        });
      };

      const runListDatabases = async () => {
        const tools = toolsController.getActiveTools();
        await tools['list-databases'].execute?.({}, {
          toolCallId: 'call-1',
        } as any);
      };

      // Tool telemetry is fire-and-forget, and the pipeline only drains on
      // close or on its timer, so give the event time to reach the client.
      const waitForSend = async () => {
        const deadline = Date.now() + 2000;
        while (!sendEvents.called && Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      };

      it('reports the tool call to the Atlas API client', async function () {
        setTelemetryEnabled(true);
        await runListDatabases();
        await toolsController.stopServer();
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
        setTelemetryEnabled(false);
        await runListDatabases();
        await toolsController.stopServer();

        // Long enough for the fire-and-forget tool telemetry and the drain.
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(sendEvents.called).to.equal(false);
      });
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
      it('starts the MCP server', async function () {
        expect(toolsController.server).to.be.undefined;

        await toolsController.startServer();

        expect(toolsController.server).to.not.be.undefined;
      });

      it('does not restart server if already started', async function () {
        await toolsController.startServer();
        const firstServer = toolsController.server;

        await toolsController.startServer();
        const secondServer = toolsController.server;

        expect(firstServer).to.equal(secondServer);
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
            'In-memory MCP server started successfully'
          )
        ).to.be.true;
      });

      it('handles errors during server startup gracefully', async function () {
        const errorController = new ToolsController({
          enableMCPTelemetry: false,
          logger,
          getTelemetryAnonymousId,
          track: createNoopTrack(),
          preferences,
          atlasAdminApi,
        });
        sandbox
          .stub(errorController as any, 'createServer')
          .throws(new Error('Server creation error'));
        const logStub = sandbox.stub(logger.log, 'error');

        // Should not throw even if there's an error
        await errorController.startServer();

        expect(errorController.server).to.be.undefined;
        for (const args of logStub.args) {
          (args[0] as any) = args[0].__value;
        }
        expect(
          logStub.calledWith(
            sinon.match.number,
            'ToolsController',
            'Error when attempting to start MCP server'
          )
        ).to.be.true;

        // don't hang
        await errorController.stopServer();
      });
    });

    describe('stopServer', function () {
      it('stops the MCP server', async function () {
        await toolsController.startServer();
        expect(toolsController.server).to.not.be.undefined;

        await toolsController.stopServer();

        // Server should be cleaned up
        expect(() => toolsController.stopServer()).to.not.throw();
      });

      it('handles stop when server is not running', async function () {
        await toolsController.stopServer();

        // Should not throw
        expect(() => toolsController.stopServer()).to.not.throw();
      });

      it('logs when server stops successfully', async function () {
        // TODO: flushTimeout.unref is not a function
        if ((process as any).type === 'renderer') {
          return this.skip();
        }

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

  describe('server property', function () {
    it('returns undefined when server is not started', function () {
      expect(toolsController.server).to.be.undefined;
    });

    it('returns server instance when started', async function () {
      await toolsController.startServer();

      expect(toolsController.server).to.not.be.undefined;
      expect(toolsController.server).to.have.property('tools');
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

  describe('db-read tool execution', function () {
    beforeEach(async function () {
      sandbox.stub(NodeDriverServiceProvider, 'connect').resolves({
        close: sandbox.stub().resolves(),
        initialDb: 'test',
        listDatabases: sandbox.stub().resolves({
          databases: [{ name: 'admin', sizeOnDisk: 1024 }],
        }),
      } as any);

      await toolsController.startServer();
      toolsController.setActiveTools(new Set(['db-read']));
      toolsController.setConnectionIdForToolCall({
        toolCallId: 'call-1',
        connectionId: 'conn-1',
      });
      toolsController.setContext({
        enableMCPTelemetry: false,
        connections: [
          {
            connectionId: 'conn-1',
            connectionString: 'mongodb://localhost:27017',
            connectOptions: {} as any,
          },
        ],
      });
    });

    it('invokes the MCP tool against the Compass connection', async function () {
      const tools = toolsController.getActiveTools();
      const result: any = await tools['list-databases'].execute?.({}, {
        toolCallId: 'call-1',
      } as any);

      expect(result.isError).to.not.equal(true);
      expect(JSON.stringify(result.content)).to.include('admin');
    });

    it('does not expose the connection handle to the model', function () {
      const tools = toolsController.getActiveTools();
      const shape = (tools['list-databases'] as any).inputSchema.shape;

      expect(shape).to.not.have.property('connectionId');
    });

    it('exposes schemas the model arguments can be validated against', function () {
      const tools = toolsController.getActiveTools();
      const schema = (tools['find'] as any).inputSchema;

      expect(
        schema.safeParse({
          database: 'db',
          collection: 'coll',
          filter: { status: 'active' },
          limit: 5,
        }).success
      ).to.equal(true);
      expect(schema.safeParse({ database: 'db' }).success).to.equal(false);
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
