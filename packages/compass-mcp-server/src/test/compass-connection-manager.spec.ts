import { expect } from 'chai';
import sinon from 'sinon';
import { NodeDriverServiceProvider } from '@mongosh/service-provider-node-driver';
import {
  CompassConnectionManager,
  type CompassConnectionManagerOptions,
  type ConsentResult,
  type ResolvedConnection,
} from '../compass-connection-manager';
import type { McpAccess } from '@mongodb-js/connection-info';

// Minimal options builder — every test starts from these defaults and
// overrides the bits it cares about. Keeps the test bodies readable.
function makeOpts(
  overrides: Partial<CompassConnectionManagerOptions> = {}
): CompassConnectionManagerOptions {
  return {
    getConnectionInfo: sinon
      .stub<[string], Promise<ResolvedConnection | undefined>>()
      .resolves({
        connectionString: 'mongodb://localhost:27017',
        displayName: 'local',
      }),
    checkAccess: sinon
      .stub<[string], Promise<McpAccess>>()
      .resolves({ mode: 'allowed', preset: 'read-only' }),
    requestAccessFromUI: sinon.stub<
      [{ connectionId: string; connectionName: string; clientName: string }],
      Promise<ConsentResult>
    >(),
    saveAccess: sinon.stub<[string, McpAccess], Promise<void>>().resolves(),
    ...overrides,
  };
}

describe('CompassConnectionManager', function () {
  let providerStub: sinon.SinonStub;
  let fakeProvider: { close: sinon.SinonStub };

  beforeEach(function () {
    // Replace NodeDriverServiceProvider.connect so no real MongoDB call is
    // made. Each test that gets to the connect step asserts on the URI we
    // pass through.
    fakeProvider = { close: sinon.stub().resolves() };
    providerStub = sinon
      .stub(NodeDriverServiceProvider, 'connect')
      .resolves(fakeProvider as unknown as NodeDriverServiceProvider);
  });

  afterEach(function () {
    providerStub.restore();
  });

  describe('connect — unknown id', function () {
    it('returns an errored state without calling provider.connect or checkAccess', async function () {
      const opts = makeOpts({
        getConnectionInfo: sinon.stub().resolves(undefined),
      });
      const mgr = new CompassConnectionManager(opts);
      const state = await mgr.connect({ connectionString: 'missing-id' });
      expect(state.tag).to.equal('errored');
      expect((state as { errorReason?: string }).errorReason ?? '').to.match(
        /No Compass connection found/
      );
      expect(providerStub.callCount).to.equal(0);
      expect((opts.checkAccess as sinon.SinonStub).callCount).to.equal(0);
      expect(mgr.getActivePreset()).to.equal(undefined);
    });
  });

  describe('connect — Atlas Stream rejection', function () {
    it('rejects Atlas Stream connection strings before consent / driver', async function () {
      const opts = makeOpts({
        getConnectionInfo: sinon.stub().resolves({
          connectionString:
            'mongodb://atlas-stream-foo.mongodb.net:27017/?tls=true',
          displayName: 'stream',
        }),
      });
      const mgr = new CompassConnectionManager(opts);
      const state = await mgr.connect({ connectionString: 'id' });
      expect(state.tag).to.equal('errored');
      expect((state as { errorReason?: string }).errorReason ?? '').to.match(
        /Atlas Stream/
      );
      expect(providerStub.callCount).to.equal(0);
      expect((opts.checkAccess as sinon.SinonStub).callCount).to.equal(0);
    });
  });

  describe('connect — stored access policies', function () {
    it('passes through stored "allowed" + preset without prompting', async function () {
      const opts = makeOpts({
        checkAccess: sinon
          .stub()
          .resolves({ mode: 'allowed', preset: 'metadata-only' }),
      });
      const mgr = new CompassConnectionManager(opts);
      const state = await mgr.connect({ connectionString: 'id' });
      expect(state.tag).to.equal('connected');
      expect(mgr.getActivePreset()).to.equal('metadata-only');
      expect((opts.requestAccessFromUI as sinon.SinonStub).callCount).to.equal(
        0
      );
    });

    it('stored "denied" short-circuits to error without prompting', async function () {
      const opts = makeOpts({
        checkAccess: sinon.stub().resolves({ mode: 'denied' }),
      });
      const mgr = new CompassConnectionManager(opts);
      const state = await mgr.connect({ connectionString: 'id' });
      expect(state.tag).to.equal('errored');
      expect((state as { errorReason?: string }).errorReason ?? '').to.match(
        /denied/
      );
      expect(providerStub.callCount).to.equal(0);
      expect((opts.requestAccessFromUI as sinon.SinonStub).callCount).to.equal(
        0
      );
      expect(mgr.getActivePreset()).to.equal(undefined);
    });
  });

  describe('connect — ask flow', function () {
    it('prompts the UI when checkAccess returns ask', async function () {
      const opts = makeOpts({
        checkAccess: sinon.stub().resolves({ mode: 'ask' }),
        requestAccessFromUI: sinon.stub().resolves({
          access: { mode: 'allowed', preset: 'read-only' },
          remember: false,
        }),
      });
      const mgr = new CompassConnectionManager(opts);
      await mgr.connect({ connectionString: 'id' });
      expect((opts.requestAccessFromUI as sinon.SinonStub).callCount).to.equal(
        1
      );
    });

    it('passes connectionId, displayName and clientName to the UI prompt', async function () {
      const opts = makeOpts({
        getConnectionInfo: sinon.stub().resolves({
          connectionString: 'mongodb://localhost:27017',
          displayName: 'production-db',
        }),
        checkAccess: sinon.stub().resolves({ mode: 'ask' }),
        requestAccessFromUI: sinon.stub().resolves({
          access: { mode: 'allowed', preset: 'metadata-only' },
          remember: false,
        }),
      });
      const mgr = new CompassConnectionManager(opts);
      mgr.setClientName('claude-ai');
      await mgr.connect({ connectionString: 'prod-id' });
      const args = (opts.requestAccessFromUI as sinon.SinonStub).firstCall
        .args[0];
      expect(args.connectionId).to.equal('prod-id');
      expect(args.connectionName).to.equal('production-db');
      expect(args.clientName).to.equal('claude-ai');
    });

    it('falls back to "Unknown AI client" when no clientName was set', async function () {
      const opts = makeOpts({
        checkAccess: sinon.stub().resolves({ mode: 'ask' }),
        requestAccessFromUI: sinon.stub().resolves({
          access: { mode: 'allowed', preset: 'read-only' },
          remember: false,
        }),
      });
      const mgr = new CompassConnectionManager(opts);
      // No setClientName call.
      await mgr.connect({ connectionString: 'id' });
      const args = (opts.requestAccessFromUI as sinon.SinonStub).firstCall
        .args[0];
      expect(args.clientName).to.equal('Unknown AI client');
    });

    it('calls saveAccess when the user picked "remember"', async function () {
      const opts = makeOpts({
        checkAccess: sinon.stub().resolves({ mode: 'ask' }),
        requestAccessFromUI: sinon.stub().resolves({
          access: { mode: 'allowed', preset: 'full-access' },
          remember: true,
        }),
      });
      const mgr = new CompassConnectionManager(opts);
      await mgr.connect({ connectionString: 'id' });
      const save = opts.saveAccess as sinon.SinonStub;
      expect(save.callCount).to.equal(1);
      expect(save.firstCall.args[0]).to.equal('id');
      expect(save.firstCall.args[1]).to.deep.equal({
        mode: 'allowed',
        preset: 'full-access',
      });
    });

    it('does NOT call saveAccess when "remember" was not checked', async function () {
      const opts = makeOpts({
        checkAccess: sinon.stub().resolves({ mode: 'ask' }),
        requestAccessFromUI: sinon.stub().resolves({
          access: { mode: 'allowed', preset: 'read-only' },
          remember: false,
        }),
      });
      const mgr = new CompassConnectionManager(opts);
      await mgr.connect({ connectionString: 'id' });
      expect((opts.saveAccess as sinon.SinonStub).callCount).to.equal(0);
    });

    it('returns an errored state when the user denies via the dialog', async function () {
      const opts = makeOpts({
        checkAccess: sinon.stub().resolves({ mode: 'ask' }),
        requestAccessFromUI: sinon.stub().resolves({
          access: { mode: 'denied' },
          remember: false,
        }),
      });
      const mgr = new CompassConnectionManager(opts);
      const state = await mgr.connect({ connectionString: 'id' });
      expect(state.tag).to.equal('errored');
      expect(providerStub.callCount).to.equal(0);
      expect(mgr.getActivePreset()).to.equal(undefined);
    });
  });

  describe('connect — driver invocation', function () {
    it('tags the connection string with an appName so MongoDB logs can identify MCP traffic', async function () {
      const opts = makeOpts({
        getConnectionInfo: sinon.stub().resolves({
          connectionString: 'mongodb://localhost:27017/?appName=user-app',
          displayName: 'local',
        }),
      });
      const mgr = new CompassConnectionManager(opts);
      await mgr.connect({ connectionString: 'id' });
      expect(providerStub.callCount).to.equal(1);
      const uri = providerStub.firstCall.args[0] as string;
      // Existing appName is preserved + "(MCP)" appended.
      expect(uri).to.match(/appName=user-app/);
      expect(uri).to.match(/%28MCP%29|MCP/);
    });

    it('sets activePreset on success', async function () {
      const opts = makeOpts({
        checkAccess: sinon
          .stub()
          .resolves({ mode: 'allowed', preset: 'full-access' }),
      });
      const mgr = new CompassConnectionManager(opts);
      const state = await mgr.connect({ connectionString: 'id' });
      expect(state.tag).to.equal('connected');
      expect(mgr.getActivePreset()).to.equal('full-access');
    });

    it('returns errored + clears activePreset when the driver throws', async function () {
      providerStub.rejects(new Error('Authentication failed'));
      const mgr = new CompassConnectionManager(makeOpts());
      const state = await mgr.connect({ connectionString: 'id' });
      expect(state.tag).to.equal('errored');
      expect((state as { errorReason?: string }).errorReason ?? '').to.match(
        /Authentication failed/
      );
      expect(mgr.getActivePreset()).to.equal(undefined);
    });
  });

  describe('disconnect', function () {
    it('closes the provider and clears the active preset', async function () {
      const mgr = new CompassConnectionManager(makeOpts());
      await mgr.connect({ connectionString: 'id' });
      expect(mgr.getActivePreset()).to.equal('read-only');
      const state = await mgr.disconnect();
      expect(state.tag).to.equal('disconnected');
      expect(fakeProvider.close.callCount).to.equal(1);
      expect(mgr.getActivePreset()).to.equal(undefined);
    });

    it('swallows provider.close errors (connection may already be dead)', async function () {
      fakeProvider.close.rejects(new Error('already closed'));
      const mgr = new CompassConnectionManager(makeOpts());
      await mgr.connect({ connectionString: 'id' });
      // Should resolve, not reject.
      const state = await mgr.disconnect();
      expect(state.tag).to.equal('disconnected');
    });

    it('is a no-op when no connection was established', async function () {
      const mgr = new CompassConnectionManager(makeOpts());
      const state = await mgr.disconnect();
      expect(state.tag).to.equal('disconnected');
      expect(fakeProvider.close.callCount).to.equal(0);
    });
  });

  describe('close', function () {
    it('disconnects and emits the close event', async function () {
      const mgr = new CompassConnectionManager(makeOpts());
      await mgr.connect({ connectionString: 'id' });
      const closeListener = sinon.stub();
      mgr.events.on('close', closeListener);
      await mgr.close();
      expect(closeListener.callCount).to.equal(1);
      expect(mgr.getActivePreset()).to.equal(undefined);
    });
  });
});
