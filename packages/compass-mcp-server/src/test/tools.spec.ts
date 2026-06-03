import { expect } from 'chai';
import sinon from 'sinon';
import { CompassConnectTool } from '../compass-connect-tool';
import { CompassOpenCollectionTool } from '../compass-open-collection-tool';
import { ListConnectionsTool } from '../list-connections-tool';
import type { CompassToolContext } from '../compass-tool-context';

// All three tools extend an upstream class whose constructor wires up
// Session / Telemetry / Server. We don't exercise any of that in our tests:
// our execute methods only touch `this.context` (Compass-specific) and, for
// CompassConnectTool, `this.session.connectToMongoDB`. So we sidestep the
// real constructor and build a minimal `this` by hand, then invoke the
// protected `execute` method directly. The unsafe casts are local to the
// test scaffolding — production code keeps its types.

function buildContext(
  overrides: Partial<CompassToolContext> = {}
): CompassToolContext {
  return {
    getAllConnections: sinon.stub().resolves([]),
    openCollection: sinon.stub(),
    checkAccess: sinon.stub(),
    ...overrides,
  };
}

// Call the (protected) `execute` method on `tool` with the given `args`.
// Threads context and (optionally) session via the test-only `this` object.
async function exec<T>(
  ToolClass: new (...args: never[]) => unknown,
  args: unknown,
  scope: { context?: CompassToolContext; session?: unknown }
): Promise<T> {
  const proto = ToolClass.prototype as unknown as {
    execute: (this: unknown, a: unknown, b?: unknown) => Promise<T>;
  };
  return await proto.execute.call(scope, args);
}

describe('CompassConnectTool', function () {
  it('treats connectionString as a Compass id and connects via session', async function () {
    const connectToMongoDB = sinon.stub().resolves();
    const result = await exec<{ content: { text: string }[] }>(
      CompassConnectTool,
      { connectionId: 'my-prod' },
      { session: { connectToMongoDB } }
    );
    expect(connectToMongoDB.callCount).to.equal(1);
    // The connectionId is forwarded as the `connectionString` field because
    // CompassConnectionManager treats that field as a Compass id.
    expect(connectToMongoDB.firstCall.args[0]).to.deep.equal({
      connectionString: 'my-prod',
    });
    expect(result.content[0].text).to.match(
      /Connected to Compass connection my-prod/
    );
  });

  it('static toolName is "connect" (replaces upstream)', function () {
    expect(CompassConnectTool.toolName).to.equal('connect');
    expect(CompassConnectTool.operationType).to.equal('connect');
  });
});

describe('ListConnectionsTool', function () {
  it('returns connections from the context as a JSON text block', async function () {
    const connections = [
      {
        id: 'a',
        name: 'Alpha',
        access: { mode: 'allowed', preset: 'read-only' },
      },
      { id: 'b', name: 'Beta', access: { mode: 'denied' } },
    ];
    const context = buildContext({
      getAllConnections: sinon.stub().resolves(connections),
    });
    const result = await exec<{ content: { text: string }[] }>(
      ListConnectionsTool,
      {},
      { context }
    );
    const parsed = JSON.parse(result.content[0].text) as unknown[];
    expect(parsed).to.deep.equal(connections);
  });

  it('calls checkAccess against its own tool name', async function () {
    const checkAccess = sinon.stub();
    const context = buildContext({ checkAccess });
    await exec(ListConnectionsTool, {}, { context });
    expect(checkAccess.callCount).to.equal(1);
    expect(checkAccess.firstCall.args[0]).to.equal('list-connections');
  });

  it('returns an empty list when no context is available (session edge case)', async function () {
    const result = await exec<{ content: { text: string }[] }>(
      ListConnectionsTool,
      {},
      {}
    );
    expect(result.content[0].text).to.equal('[]');
  });

  it('static toolName is "list-connections", operationType is "metadata"', function () {
    expect(ListConnectionsTool.toolName).to.equal('list-connections');
    expect(ListConnectionsTool.operationType).to.equal('metadata');
  });
});

describe('CompassOpenCollectionTool', function () {
  it('forwards namespace + options to context.openCollection', async function () {
    const openCollection = sinon.stub();
    const context = buildContext({ openCollection });
    await exec(
      CompassOpenCollectionTool,
      {
        connectionId: 'conn',
        database: 'sample_mflix',
        collection: 'movies',
      },
      { context }
    );
    expect(openCollection.callCount).to.equal(1);
    const [connId, ns] = openCollection.firstCall.args as [string, string];
    expect(connId).to.equal('conn');
    expect(ns).to.equal('sample_mflix.movies');
  });

  it('builds an initialQuery from filter/projection/sort/limit', async function () {
    const openCollection = sinon.stub();
    const context = buildContext({ openCollection });
    await exec(
      CompassOpenCollectionTool,
      {
        connectionId: 'c',
        database: 'd',
        collection: 'coll',
        filter: { year: { $gte: 2020 } },
        projection: { title: 1 },
        sort: { year: -1 },
        limit: 5,
      },
      { context }
    );
    const options = openCollection.firstCall.args[2] as {
      initialQuery?: Record<string, unknown>;
    };
    expect(options.initialQuery).to.deep.equal({
      filter: { year: { $gte: 2020 } },
      // Renamed to `project` because that's what the collection workspace
      // plugin reads.
      project: { title: 1 },
      sort: { year: -1 },
      limit: 5,
    });
  });

  it('auto-selects the Aggregations subtab when a pipeline is provided', async function () {
    const openCollection = sinon.stub();
    const context = buildContext({ openCollection });
    await exec(
      CompassOpenCollectionTool,
      {
        connectionId: 'c',
        database: 'd',
        collection: 'coll',
        pipeline: [{ $match: { x: 1 } }, { $count: 'n' }],
      },
      { context }
    );
    const options = openCollection.firstCall.args[2] as {
      subtab?: string;
      initialPipeline?: unknown[];
    };
    expect(options.subtab).to.equal('Aggregations');
    expect(options.initialPipeline).to.have.lengthOf(2);
  });

  it('omits initialQuery when no query fields were given', async function () {
    const openCollection = sinon.stub();
    const context = buildContext({ openCollection });
    await exec(
      CompassOpenCollectionTool,
      { connectionId: 'c', database: 'd', collection: 'coll' },
      { context }
    );
    const options = openCollection.firstCall.args[2] as {
      initialQuery?: Record<string, unknown>;
    };
    expect(options.initialQuery).to.equal(undefined);
  });

  it('explicit subtab takes precedence over the pipeline auto-selection', async function () {
    const openCollection = sinon.stub();
    const context = buildContext({ openCollection });
    await exec(
      CompassOpenCollectionTool,
      {
        connectionId: 'c',
        database: 'd',
        collection: 'coll',
        subtab: 'Schema',
        pipeline: [{ $match: {} }],
      },
      { context }
    );
    const options = openCollection.firstCall.args[2] as { subtab?: string };
    expect(options.subtab).to.equal('Schema');
  });

  it('calls checkAccess against its own tool name', async function () {
    const checkAccess = sinon.stub();
    const context = buildContext({ checkAccess });
    await exec(
      CompassOpenCollectionTool,
      { connectionId: 'c', database: 'd', collection: 'coll' },
      { context }
    );
    expect(checkAccess.firstCall.args[0]).to.equal('compass-open-collection');
  });

  it('returns a non-data acknowledgement message (no documents leaked)', async function () {
    const context = buildContext();
    const result = await exec<{ content: { text: string }[] }>(
      CompassOpenCollectionTool,
      { connectionId: 'c', database: 'd', collection: 'coll' },
      { context }
    );
    expect(result.content[0].text).to.match(/Opened d.coll/);
  });

  it('gracefully reports when context is unavailable (no Compass UI)', async function () {
    const result = await exec<{ content: { text: string }[] }>(
      CompassOpenCollectionTool,
      { connectionId: 'c', database: 'd', collection: 'coll' },
      {}
    );
    expect(result.content[0].text).to.match(/Compass UI is not available/);
  });
});
