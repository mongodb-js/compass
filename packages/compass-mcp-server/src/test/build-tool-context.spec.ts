import { expect } from 'chai';
import sinon from 'sinon';
import {
  buildToolContext,
  withAccessCheck,
  aggregateStageGate,
} from '../build-tool-context';
import { McpAccessDeniedError } from '../compass-tool-context';
import type { CompassConnectionManager } from '../compass-connection-manager';
import type { McpPreset } from '@mongodb-js/connection-info';

// Lightweight stand-in for the real CompassConnectionManager: only the bit
// our gate touches matters here.
function stubManager(preset: McpPreset | undefined) {
  return {
    getActivePreset: sinon.stub().returns(preset),
  } as unknown as CompassConnectionManager;
}

const shared = {
  getAllConnections: () => Promise.resolve([]),
  openCollection: () => {
    /* no-op */
  },
};

describe('buildToolContext', function () {
  describe('checkAccess', function () {
    // The gate must NEVER deny when no preset is active — `connect` and
    // `list-connections` run before a connection exists, and denying them
    // would deadlock the whole session.
    it('is a no-op when no connection has been established (preset === undefined)', function () {
      const ctx = buildToolContext(stubManager(undefined), shared);
      expect(() => ctx.checkAccess('find')).to.not.throw();
      expect(() => ctx.checkAccess('drop-database')).to.not.throw();
    });

    it('allows tools that the active preset includes', function () {
      const ctx = buildToolContext(stubManager('read-only'), shared);
      expect(() => ctx.checkAccess('find')).to.not.throw();
      expect(() => ctx.checkAccess('list-databases')).to.not.throw();
    });

    it('throws McpAccessDeniedError for tools the active preset excludes', function () {
      const ctx = buildToolContext(stubManager('metadata-only'), shared);
      expect(() => ctx.checkAccess('find')).to.throw(McpAccessDeniedError);
      expect(() => ctx.checkAccess('insert-many')).to.throw(
        McpAccessDeniedError
      );
    });

    it('error carries toolName + preset so we can render a useful message', function () {
      const ctx = buildToolContext(stubManager('read-only'), shared);
      try {
        ctx.checkAccess('drop-collection');
        expect.fail('expected throw');
      } catch (err) {
        expect(err).to.be.instanceOf(McpAccessDeniedError);
        const e = err as McpAccessDeniedError;
        expect(e.toolName).to.equal('drop-collection');
        expect(e.preset).to.equal('read-only');
        expect(e.message).to.match(/Access denied/);
      }
    });

    it('re-reads the preset on every call (manager state can change mid-session)', function () {
      const getActivePreset = sinon
        .stub<[], McpPreset | undefined>()
        .returns('metadata-only')
        .onSecondCall()
        .returns('read-only');
      const ctx = buildToolContext(
        { getActivePreset } as unknown as CompassConnectionManager,
        shared
      );
      expect(() => ctx.checkAccess('find')).to.throw(McpAccessDeniedError);
      expect(() => ctx.checkAccess('find')).to.not.throw();
      expect(getActivePreset.callCount).to.equal(2);
    });
  });

  it('passes through getAllConnections / openCollection from the shared opts', function () {
    const getAllConnections = sinon.stub().resolves([{ id: 'x' }]);
    const openCollection = sinon.stub();
    const ctx = buildToolContext(stubManager('full-access'), {
      getAllConnections,
      openCollection,
    });
    void ctx.getAllConnections();
    ctx.openCollection('id', 'db.coll');
    expect(getAllConnections).to.have.property('callCount', 1);
    expect(openCollection).to.have.property('callCount', 1);
  });
});

describe('withAccessCheck', function () {
  // The HOC wraps upstream tool classes whose execute() we can't edit.
  // We need it to:
  //  1. preserve the statics our registry reads (toolName etc.)
  //  2. call ctx.checkAccess before delegating
  //  3. optionally run validateArgs after the preset check passes
  //  4. call super.execute when both checks succeed

  // Minimal class that mimics the upstream `AnyToolClass` shape: a static
  // `toolName` and an async `execute` that records its call. We use
  // 'list-databases' as the tool identity because it's in every preset's
  // allowlist — the wrapper's checkAccess will pass and let us observe the
  // post-check behavior we actually want to test.
  function makeFakeTool(name = 'list-databases') {
    const executed = sinon.stub().resolves('ok');
    class Fake {
      static toolName = name;
      static category = 'mongodb';
      static operationType = 'metadata';
      // Carried by the upstream ToolBase at runtime; we set these by hand.
      context?: ReturnType<typeof buildToolContext>;
      session?: { connectionManager: CompassConnectionManager };
      name = name;
      execute(...args: unknown[]) {
        return executed(...(args as []));
      }
    }
    return { Fake, executed };
  }

  it('preserves the static toolName / category / operationType', function () {
    const { Fake } = makeFakeTool('list-databases');
    const Wrapped = withAccessCheck(Fake as never);
    expect((Wrapped as unknown as { toolName: string }).toolName).to.equal(
      'list-databases'
    );
    expect((Wrapped as unknown as { category: string }).category).to.equal(
      'mongodb'
    );
    expect(
      (Wrapped as unknown as { operationType: string }).operationType
    ).to.equal('metadata');
  });

  it('calls execute when access is allowed', async function () {
    const { Fake, executed } = makeFakeTool();
    const Wrapped = withAccessCheck(Fake as never);
    const instance = new (Wrapped as unknown as new () => InstanceType<
      typeof Fake
    >)();
    instance.context = buildToolContext(stubManager('full-access'), shared);
    const result = await (
      instance as unknown as { execute: (a: unknown) => Promise<unknown> }
    ).execute({});
    expect(result).to.equal('ok');
    expect(executed.callCount).to.equal(1);
  });

  it('throws McpAccessDeniedError without calling execute when preset disallows', async function () {
    const { Fake, executed } = makeFakeTool();
    // Override toolName so the wrapper checks a name that read-only blocks.
    class Restricted extends Fake {
      static override toolName = 'insert-many';
      override name = 'insert-many';
    }
    const Wrapped = withAccessCheck(Restricted as never);
    const instance = new (Wrapped as unknown as new () => InstanceType<
      typeof Restricted
    >)();
    instance.context = buildToolContext(stubManager('read-only'), shared);
    try {
      await (
        instance as unknown as { execute: (a: unknown) => Promise<unknown> }
      ).execute({});
      expect.fail('expected throw');
    } catch (err) {
      expect(err).to.be.instanceOf(McpAccessDeniedError);
    }
    expect(executed.callCount).to.equal(0);
  });

  it('runs validateArgs after the preset check and aborts execute if it throws', async function () {
    const { Fake, executed } = makeFakeTool();
    const validateArgs = sinon.stub().throws(new Error('bad args'));
    const Wrapped = withAccessCheck(Fake as never, { validateArgs });
    const instance = new (Wrapped as unknown as new () => InstanceType<
      typeof Fake
    >)();
    instance.context = buildToolContext(stubManager('full-access'), shared);
    instance.session = {
      connectionManager: stubManager('full-access'),
    };
    try {
      await (
        instance as unknown as { execute: (a: unknown) => Promise<unknown> }
      ).execute({ some: 'arg' });
      expect.fail('expected throw');
    } catch (err) {
      expect((err as Error).message).to.equal('bad args');
    }
    expect(validateArgs.callCount).to.equal(1);
    expect(executed.callCount).to.equal(0);
  });

  it('skips validateArgs when no connection is active (preset undefined)', async function () {
    const { Fake, executed } = makeFakeTool();
    const validateArgs = sinon.stub();
    const Wrapped = withAccessCheck(Fake as never, { validateArgs });
    const instance = new (Wrapped as unknown as new () => InstanceType<
      typeof Fake
    >)();
    instance.context = buildToolContext(stubManager(undefined), shared);
    instance.session = { connectionManager: stubManager(undefined) };
    await (
      instance as unknown as { execute: (a: unknown) => Promise<unknown> }
    ).execute({});
    expect(validateArgs.callCount).to.equal(0);
    expect(executed.callCount).to.equal(1);
  });

  it('does not throw if context is missing (early sessions before tool registration)', async function () {
    const { Fake, executed } = makeFakeTool();
    const Wrapped = withAccessCheck(Fake as never);
    const instance = new (Wrapped as unknown as new () => InstanceType<
      typeof Fake
    >)();
    // No `instance.context` set on purpose.
    await (
      instance as unknown as { execute: (a: unknown) => Promise<unknown> }
    ).execute({});
    expect(executed.callCount).to.equal(1);
  });
});

describe('aggregateStageGate (re-tested for HOC integration)', function () {
  // Spot-check; comprehensive cases live in presets.spec.ts.
  it('does not throw on full-access', function () {
    expect(() =>
      aggregateStageGate(
        { pipeline: [{ $out: 'foo' }] },
        { preset: 'full-access', toolName: 'aggregate' }
      )
    ).to.not.throw();
  });

  it('throws on $out under read-only', function () {
    expect(() =>
      aggregateStageGate(
        { pipeline: [{ $out: 'foo' }] },
        { preset: 'read-only', toolName: 'aggregate' }
      )
    ).to.throw(McpAccessDeniedError);
  });
});
