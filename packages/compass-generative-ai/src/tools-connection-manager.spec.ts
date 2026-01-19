import Sinon from 'sinon';
import { expect } from 'chai';
import { ToolsConnectionManager } from './tools-connection-manager';
import type { ToolsConnectParams } from './tools-connection-manager';
import { NodeDriverServiceProvider } from '@mongosh/service-provider-node-driver';
import type { LoggerBase } from 'mongodb-mcp-server';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';

describe('ToolsConnectionManager', function () {
  let sandbox: Sinon.SinonSandbox;
  let logger: LoggerBase;
  let getTelemetryAnonymousId: Sinon.SinonStub;
  let connectionManager: ToolsConnectionManager;

  const mockConnectionParams: ToolsConnectParams = {
    connectionId: 'test-connection-id',
    connectionString: 'mongodb://localhost:27017/test',
    connectOptions: {
      productName: 'test',
      productDocsLink: 'http://example.com/docs',
    },
  };

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
    logger = {
      info: sandbox.stub(),
      warning: sandbox.stub(),
      error: sandbox.stub(),
      debug: sandbox.stub(),
    } as unknown as LoggerBase;
    getTelemetryAnonymousId = sandbox.stub().returns('test-anonymous-id');

    connectionManager = new ToolsConnectionManager({
      logger,
      getTelemetryAnonymousId,
    });
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('constructor', function () {
    it('creates a ToolsConnectionManager instance', function () {
      expect(connectionManager).to.be.instanceOf(ToolsConnectionManager);
    });
  });

  describe('connect', function () {
    it('rejects with an error message about using Compass connections', async function () {
      try {
        await connectionManager.connect();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Database Tools in MongoDB Compass');
        expect(error.message).to.include('connection sidebar');
        expect(error.message).to.include(
          'https://www.mongodb.com/docs/compass/connect/'
        );
      }
    });
  });

  describe('disconnect', function () {
    it('returns disconnected state when no active connection', async function () {
      const result = await connectionManager.disconnect();

      expect(result).to.deep.equal({ tag: 'disconnected' });
    });

    it('closes active connection provider', async function () {
      const mockProvider = {
        close: sandbox.stub().resolves(),
      };

      // Simulate an active connection
      (connectionManager as any).activeConnection = {
        id: 'test-id',
        provider: mockProvider,
      };

      await connectionManager.disconnect();

      expect(mockProvider.close.calledOnce).to.be.true;
    });

    it('resets active connection to null', async function () {
      const mockProvider = {
        close: sandbox.stub().resolves(),
      };

      (connectionManager as any).activeConnection = {
        id: 'test-id',
        provider: mockProvider,
      };

      await connectionManager.disconnect();

      expect((connectionManager as any).activeConnection).to.be.null;
    });

    it('logs error if provider close fails but continues', async function () {
      const closeError = new Error('Close failed');
      const mockProvider = {
        close: sandbox.stub().rejects(closeError),
      };

      (connectionManager as any).activeConnection = {
        id: 'test-id',
        provider: mockProvider,
      };

      const result = await connectionManager.disconnect();

      expect(logger.error).to.have.been.calledWith(
        Sinon.match({
          id: mongoLogId(1_001_000_411),
          context: 'compass-tools-connection-manager',
          message: Sinon.match(/Error disconnecting/),
        })
      );
      expect(result).to.deep.equal({ tag: 'disconnected' });
    });
  });

  describe('close', function () {
    it('calls disconnect and emits close event', async function () {
      const disconnectSpy = sandbox.spy(connectionManager, 'disconnect');
      const emitSpy = sandbox.spy((connectionManager as any)._events, 'emit');

      await connectionManager.close();

      expect(disconnectSpy.calledOnce).to.be.true;
      expect(emitSpy.calledWith('close')).to.be.true;
    });
  });

  describe('connectToCompassConnection', function () {
    let connectStub: Sinon.SinonStub;

    beforeEach(function () {
      connectStub = sandbox
        .stub(NodeDriverServiceProvider, 'connect')
        .resolves({
          close: sandbox.stub().resolves(),
        } as any);
    });

    it('connects successfully with valid connection params', async function () {
      await connectionManager.connectToCompassConnection(mockConnectionParams);

      expect(connectStub.calledOnce).to.be.true;
      expect((connectionManager as any).activeConnection).to.not.be.null;
      expect((connectionManager as any).activeConnection.id).to.equal(
        'test-connection-id'
      );
    });

    it('throws error if already connected', async function () {
      // First connection
      await connectionManager.connectToCompassConnection(mockConnectionParams);

      // Second connection attempt
      try {
        await connectionManager.connectToCompassConnection(
          mockConnectionParams
        );
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal(
          'Already connected to a Compass connection'
        );
      }
    });

    it('logs error and sets errored state when connection fails', async function () {
      const connectionError = new Error('Connection timeout');
      connectStub.rejects(connectionError);

      await connectionManager.connectToCompassConnection(mockConnectionParams);

      expect(logger.error).to.have.been.calledWith(
        Sinon.match({
          id: mongoLogId(1_001_000_412),
          message: Sinon.match(/Error connecting to Compass connection/),
        })
      );
    });

    it('sets connection state to connected on success', async function () {
      const changeStateSpy = sandbox.spy(
        connectionManager as any,
        'changeState'
      );

      await connectionManager.connectToCompassConnection(mockConnectionParams);

      expect(
        changeStateSpy.calledWith('connection-success', Sinon.match.object)
      ).to.be.true;
    });

    it('sets connection state to errored on failure', async function () {
      connectStub.rejects(new Error('Connection failed'));
      const changeStateSpy = sandbox.spy(
        connectionManager as any,
        'changeState'
      );

      await connectionManager.connectToCompassConnection(mockConnectionParams);

      expect(
        changeStateSpy.calledWith(
          'connection-error',
          Sinon.match({
            tag: 'errored',
            errorReason: 'Connection failed',
          })
        )
      ).to.be.true;
    });

    it('uses overridden appName when connecting', async function () {
      await connectionManager.connectToCompassConnection(mockConnectionParams);

      expect(connectStub.calledOnce).to.be.true;
      const [connectionString] = connectStub.firstCall.args;
      expect(connectionString).to.include(
        'appName=MongoDB+Compass+Database+Tools'
      );
    });
  });

  describe('overridePresetAppName', function () {
    it('adds default appName when none is present', function () {
      const result =
        connectionManager.overridePresetAppName(mockConnectionParams);

      expect(result.connectionString).to.include(
        'appName=MongoDB+Compass+Database+Tools'
      );
    });

    it('preserves existing appName with Database Tools', function () {
      const paramsWithAppName: ToolsConnectParams = {
        connectionId: 'test-id',
        connectionString:
          'mongodb://localhost:27017?appName=MongoDB+Compass+Database+Tools',
        connectOptions: {
          productName: 'test',
          productDocsLink: 'http://example.com/docs',
        },
      };

      const result = connectionManager.overridePresetAppName(paramsWithAppName);

      expect(result.connectionString).to.include(
        'appName=MongoDB+Compass+Database+Tools'
      );
    });

    it('overrides Compass appName without Database Tools', function () {
      const paramsWithCompassAppName: ToolsConnectParams = {
        connectionId: 'test-id',
        connectionString: 'mongodb://localhost:27017?appName=MongoDB%20Compass',
        connectOptions: {
          productName: 'test',
          productDocsLink: 'http://example.com/docs',
        },
      };

      const result = connectionManager.overridePresetAppName(
        paramsWithCompassAppName
      );

      expect(result.connectionString).to.include(
        'appName=MongoDB+Compass+Database+Tools'
      );
    });

    it('adds telemetry anonymous ID for Atlas connections', function () {
      const atlasParams: ToolsConnectParams = {
        connectionId: 'atlas-conn-id',
        connectionString: 'mongodb+srv://cluster.mongodb.net/test',
        connectOptions: {
          productName: 'test',
          productDocsLink: 'http://example.com/docs',
        },
      };

      const result = connectionManager.overridePresetAppName(atlasParams);

      expect(result.connectionString).to.include('test-anonymous-id');
      expect(result.connectionString).to.include('atlas-conn-id');
      expect(result.connectOptions.appName).to.include('test-anonymous-id');
      expect(result.connectOptions.appName).to.include('atlas-conn-id');
    });

    it('does not add telemetry ID for non-Atlas connections', function () {
      const result =
        connectionManager.overridePresetAppName(mockConnectionParams);

      expect(result.connectionString).to.not.include('test-anonymous-id');
      expect(result.connectionString).to.not.include('test-connection-id');
      expect(result.connectOptions.appName).to.equal(
        'MongoDB Compass Database Tools'
      );
    });

    it('returns new object with updated connection string', function () {
      const result =
        connectionManager.overridePresetAppName(mockConnectionParams);

      expect(result).to.not.equal(mockConnectionParams);
      expect(result.connectionId).to.equal(mockConnectionParams.connectionId);
      expect(result.connectionString).to.not.equal(
        mockConnectionParams.connectionString
      );
    });

    it('handles empty appName', function () {
      const paramsWithEmptyAppName: ToolsConnectParams = {
        connectionId: 'test-id',
        connectionString: 'mongodb://localhost:27017?appName=',
        connectOptions: {
          productName: 'test',
          productDocsLink: 'http://example.com/docs',
        },
      };

      const result = connectionManager.overridePresetAppName(
        paramsWithEmptyAppName
      );

      expect(result.connectionString).to.include(
        'appName=MongoDB+Compass+Database+Tools'
      );
    });

    it('preserves other query parameters', function () {
      const paramsWithOtherParams: ToolsConnectParams = {
        connectionId: 'test-id',
        connectionString:
          'mongodb://localhost:27017?retryWrites=true&w=majority',
        connectOptions: {
          productName: 'test',
          productDocsLink: 'http://example.com/docs',
        },
      };

      const result = connectionManager.overridePresetAppName(
        paramsWithOtherParams
      );

      expect(result.connectionString).to.include('retryWrites=true');
      expect(result.connectionString).to.include('w=majority');
    });

    it('handles connection string with auth credentials', function () {
      const paramsWithAuth: ToolsConnectParams = {
        connectionId: 'test-id',
        connectionString: 'mongodb://user:pass@localhost:27017/test',
        connectOptions: {
          productName: 'test',
          productDocsLink: 'http://example.com/docs',
        },
      };

      const result = connectionManager.overridePresetAppName(paramsWithAuth);

      expect(result.connectionString).to.include('user:pass@');
      expect(result.connectionString).to.include(
        'appName=MongoDB+Compass+Database+Tools'
      );
    });

    it('handles MongoDB SRV connection strings', function () {
      const srvParams: ToolsConnectParams = {
        connectionId: 'srv-id',
        connectionString: 'mongodb+srv://cluster.example.com/test',
        connectOptions: {
          productName: 'test',
          productDocsLink: 'http://example.com/docs',
        },
      };

      const result = connectionManager.overridePresetAppName(srvParams);

      expect(result.connectionString).to.include('mongodb+srv://');
      expect(result.connectionString).to.include(
        'appName=MongoDB+Compass+Database+Tools'
      );
    });

    it('uses getTelemetryAnonymousId function', function () {
      const atlasParams: ToolsConnectParams = {
        connectionId: 'atlas-id',
        connectionString: 'mongodb+srv://cluster.mongodb.net/test',
        connectOptions: {
          productName: 'test',
          productDocsLink: 'http://example.com/docs',
        },
      };

      connectionManager.overridePresetAppName(atlasParams);

      expect(getTelemetryAnonymousId.called).to.be.true;
    });

    it('handles getTelemetryAnonymousId returning empty string', function () {
      getTelemetryAnonymousId.returns('');

      const atlasParams: ToolsConnectParams = {
        connectionId: 'atlas-id',
        connectionString: 'mongodb+srv://cluster.mongodb.net/test',
        connectOptions: {
          productName: 'test',
          productDocsLink: 'http://example.com/docs',
        },
      };

      const result = connectionManager.overridePresetAppName(atlasParams);

      // Should still include connection ID even without anonymous ID
      expect(result.connectOptions.appName).to.include('atlas-id');
    });
  });

  describe('integration scenarios', function () {
    let connectStub: Sinon.SinonStub;

    beforeEach(function () {
      connectStub = sandbox
        .stub(NodeDriverServiceProvider, 'connect')
        .resolves({
          close: sandbox.stub().resolves(),
        } as any);
    });

    it('can connect and then disconnect', async function () {
      await connectionManager.connectToCompassConnection(mockConnectionParams);
      expect((connectionManager as any).activeConnection).to.not.be.null;

      await connectionManager.disconnect();
      expect((connectionManager as any).activeConnection).to.be.null;
    });

    it('can close after connecting', async function () {
      await connectionManager.connectToCompassConnection(mockConnectionParams);
      expect((connectionManager as any).activeConnection).to.not.be.null;

      await connectionManager.close();
      expect((connectionManager as any).activeConnection).to.be.null;
    });

    it('close event is emitted with current state', async function () {
      const emitHandler = sandbox.stub();
      (connectionManager as any)._events.on('close', emitHandler);

      await connectionManager.connectToCompassConnection(mockConnectionParams);
      await connectionManager.close();

      expect(emitHandler.calledOnce).to.be.true;
      const emittedState = emitHandler.firstCall.args[0];
      expect(emittedState).to.have.property('tag', 'disconnected');
    });

    it('multiple disconnect calls are safe', async function () {
      await connectionManager.connectToCompassConnection(mockConnectionParams);
      await connectionManager.disconnect();

      // Second disconnect should not throw
      await connectionManager.disconnect();
    });

    it('appName override is applied during connection', async function () {
      await connectionManager.connectToCompassConnection(mockConnectionParams);

      const [connectionString] = connectStub.firstCall.args;
      expect(connectionString).to.include(
        'appName=MongoDB+Compass+Database+Tools'
      );
    });
  });
});
