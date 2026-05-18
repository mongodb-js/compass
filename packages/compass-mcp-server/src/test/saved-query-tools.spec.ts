import { expect } from 'chai';
import sinon from 'sinon';
import { ListSavedQueriesTool } from '../list-saved-queries-tool';
import { SaveSavedQueryTool } from '../save-saved-query-tool';
import type { CompassToolContext } from '../compass-tool-context';
import type { SavedQueryItem } from '../mcp-saved-query-storage';
import { ALL_PRESETS, isToolAllowed } from '../presets';

// Same execute-via-prototype pattern as tools.spec.ts. The tool classes
// extend an upstream ToolBase whose constructor we don't want to run; we
// invoke the protected `execute` method directly with a synthetic `this`.

function buildContext(
  overrides: Partial<CompassToolContext> = {}
): CompassToolContext {
  return {
    getAllConnections: sinon.stub().resolves([]),
    openCollection: sinon.stub(),
    checkAccess: sinon.stub(),
    listSavedQueries: sinon.stub().resolves([]),
    saveSavedQuery: sinon.stub().resolves({ id: 'unused' }),
    saveSavedAggregation: sinon.stub().resolves({ id: 'unused' }),
    ...overrides,
  };
}

async function exec<T>(
  ToolClass: new (...args: never[]) => unknown,
  args: unknown,
  scope: { context?: CompassToolContext }
): Promise<T> {
  const proto = ToolClass.prototype as unknown as {
    execute: (this: unknown, a: unknown, b?: unknown) => Promise<T>;
  };
  return await proto.execute.call(scope, args);
}

describe('saved-queries MCP tools', function () {
  // Preset gating: both tools live in ALWAYS_AVAILABLE because they only
  // touch Compass's local saved-queries store, not MongoDB. Pin that
  // contract so a future refactor can't silently demote them.
  describe('preset visibility', function () {
    it('list-saved-queries is allowed under every preset', function () {
      for (const preset of ALL_PRESETS) {
        expect(isToolAllowed(preset, 'list-saved-queries')).to.equal(true);
      }
    });

    it('save-saved-query is allowed under every preset', function () {
      for (const preset of ALL_PRESETS) {
        expect(isToolAllowed(preset, 'save-saved-query')).to.equal(true);
      }
    });
  });

  describe('ListSavedQueriesTool', function () {
    it('returns the storage catalog as a JSON text block', async function () {
      const items: SavedQueryItem[] = [
        {
          type: 'query',
          id: 'q1',
          namespace: 'sample_mflix.movies',
          name: 'recent-action',
          description: 'Recent action movies',
          authoredBy: 'human',
          filter: { genre: 'Action' },
          sort: { year: -1 },
          limit: 10,
        },
      ];
      const context = buildContext({
        listSavedQueries: sinon.stub().resolves(items),
      });
      const result = await exec<{ content: { text: string }[] }>(
        ListSavedQueriesTool,
        {},
        { context }
      );
      const parsed = JSON.parse(result.content[0].text) as unknown[];
      expect(parsed).to.deep.equal(items);
    });

    it('filters by `namespace` when provided', async function () {
      const items: SavedQueryItem[] = [
        {
          type: 'query',
          id: 'q1',
          namespace: 'a.b',
          name: 'q1',
          description: 'd',
          authoredBy: 'human',
        },
        {
          type: 'aggregation',
          id: 'p1',
          namespace: 'c.d',
          name: 'p1',
          description: 'e',
          authoredBy: 'human',
          pipelineText: '[]',
        },
      ];
      const context = buildContext({
        listSavedQueries: sinon.stub().resolves(items),
      });
      const result = await exec<{ content: { text: string }[] }>(
        ListSavedQueriesTool,
        { namespace: 'c.d' },
        { context }
      );
      const parsed = JSON.parse(result.content[0].text) as Array<{
        namespace: string;
      }>;
      expect(parsed).to.have.lengthOf(1);
      expect(parsed[0].namespace).to.equal('c.d');
    });

    it('calls checkAccess against its own tool name', async function () {
      const checkAccess = sinon.stub();
      const context = buildContext({ checkAccess });
      await exec(ListSavedQueriesTool, {}, { context });
      expect(checkAccess.firstCall.args[0]).to.equal('list-saved-queries');
    });

    it('returns an empty list when no context is available', async function () {
      const result = await exec<{ content: { text: string }[] }>(
        ListSavedQueriesTool,
        {},
        {}
      );
      expect(result.content[0].text).to.equal('[]');
    });

    it('static toolName is "list-saved-queries", operationType is "metadata"', function () {
      expect(ListSavedQueriesTool.toolName).to.equal('list-saved-queries');
      expect(ListSavedQueriesTool.operationType).to.equal('metadata');
    });
  });

  describe('SaveSavedQueryTool', function () {
    it('routes type:"query" to saveSavedQuery with the correct payload', async function () {
      const saveSavedQuery = sinon.stub().resolves({ id: 'new-id-1' });
      const saveSavedAggregation = sinon.stub();
      const context = buildContext({ saveSavedQuery, saveSavedAggregation });
      const result = await exec<{ content: { text: string }[] }>(
        SaveSavedQueryTool,
        {
          type: 'query',
          name: 'recent-orders',
          description: 'Orders in the last 7 days',
          namespace: 'shop.orders',
          filter: { status: 'shipped' },
          sort: { date: -1 },
          limit: 50,
        },
        { context }
      );
      expect(saveSavedQuery.callCount).to.equal(1);
      expect(saveSavedAggregation.callCount).to.equal(0);
      expect(saveSavedQuery.firstCall.args[0]).to.deep.equal({
        name: 'recent-orders',
        description: 'Orders in the last 7 days',
        namespace: 'shop.orders',
        filter: { status: 'shipped' },
        sort: { date: -1 },
        limit: 50,
      });
      expect(result.content[0].text).to.match(/Saved query "recent-orders"/);
      expect(result.content[0].text).to.include('new-id-1');
    });

    it('forwards mcpPromptName when provided', async function () {
      const saveSavedQuery = sinon.stub().resolves({ id: 'q-id' });
      const context = buildContext({ saveSavedQuery });
      await exec(
        SaveSavedQueryTool,
        {
          type: 'query',
          name: 'recent-orders',
          description: 'Last 7 days',
          namespace: 'shop.orders',
          mcpPromptName: 'recent-orders',
        },
        { context }
      );
      const payload = saveSavedQuery.firstCall.args[0] as {
        mcpPromptName?: string;
      };
      expect(payload.mcpPromptName).to.equal('recent-orders');
    });

    it('omits mcpPromptName when not provided (does not write the key)', async function () {
      const saveSavedQuery = sinon.stub().resolves({ id: 'q-id' });
      const context = buildContext({ saveSavedQuery });
      await exec(
        SaveSavedQueryTool,
        {
          type: 'query',
          name: 'n',
          description: 'd',
          namespace: 'a.b',
        },
        { context }
      );
      const payload = saveSavedQuery.firstCall.args[0] as Record<
        string,
        unknown
      >;
      expect(payload).to.not.have.property('mcpPromptName');
    });

    it('routes type:"aggregation" to saveSavedAggregation', async function () {
      const saveSavedQuery = sinon.stub();
      const saveSavedAggregation = sinon.stub().resolves({ id: 'agg-1' });
      const context = buildContext({ saveSavedQuery, saveSavedAggregation });
      const result = await exec<{ content: { text: string }[] }>(
        SaveSavedQueryTool,
        {
          type: 'aggregation',
          name: 'churn-monthly',
          description: 'Churn rate by tier per month',
          namespace: 'sales.customers',
          pipelineText: '[{ $group: { _id: "$tier", n: { $sum: 1 } } }]',
        },
        { context }
      );
      expect(saveSavedAggregation.callCount).to.equal(1);
      expect(saveSavedQuery.callCount).to.equal(0);
      const payload = saveSavedAggregation.firstCall.args[0] as {
        name: string;
        pipelineText: string;
      };
      expect(payload.name).to.equal('churn-monthly');
      expect(payload.pipelineText).to.match(/\$group/);
      expect(result.content[0].text).to.match(
        /Saved aggregation "churn-monthly"/
      );
    });

    it('errors when type:"aggregation" but pipelineText is missing', async function () {
      const saveSavedAggregation = sinon.stub();
      const context = buildContext({ saveSavedAggregation });
      const result = await exec<{
        content: { text: string }[];
        isError?: boolean;
      }>(
        SaveSavedQueryTool,
        {
          type: 'aggregation',
          name: 'x',
          description: 'y',
          namespace: 'a.b',
        },
        { context }
      );
      expect(result.isError).to.equal(true);
      expect(result.content[0].text).to.match(/pipelineText/);
      expect(saveSavedAggregation.callCount).to.equal(0);
    });

    it('calls checkAccess against its own tool name', async function () {
      const checkAccess = sinon.stub();
      const context = buildContext({ checkAccess });
      await exec(
        SaveSavedQueryTool,
        {
          type: 'query',
          name: 'n',
          description: 'd',
          namespace: 'a.b',
        },
        { context }
      );
      expect(checkAccess.firstCall.args[0]).to.equal('save-saved-query');
    });

    it('returns an isError result when context is unavailable', async function () {
      const result = await exec<{
        content: { text: string }[];
        isError?: boolean;
      }>(
        SaveSavedQueryTool,
        {
          type: 'query',
          name: 'n',
          description: 'd',
          namespace: 'a.b',
        },
        {}
      );
      expect(result.isError).to.equal(true);
      expect(result.content[0].text).to.match(/not available/i);
    });

    it('static toolName is "save-saved-query", operationType is "metadata"', function () {
      expect(SaveSavedQueryTool.toolName).to.equal('save-saved-query');
      // Operation type is `metadata` because saving writes Compass's local
      // workspace state, not MongoDB.
      expect(SaveSavedQueryTool.operationType).to.equal('metadata');
    });
  });
});
