import { expect } from 'chai';
import sinon from 'sinon';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  SavedQueryPromptsRegistry,
  formatPromptBody,
} from '../saved-query-prompts';
import type { SavedQueryItem } from '../mcp-saved-query-storage';

// We don't construct a real McpServer for these tests — the registry only
// touches a small surface (registerCapabilities on the inner server,
// registerPrompt, sendPromptListChanged). Hand-rolled fakes that record
// calls and return manipulable handles are far easier to reason about
// than the full SDK plumbing.

interface FakePrompt {
  name: string;
  title?: string;
  description?: string;
  removed: boolean;
  updates: number;
  callback: () => unknown;
}

function makeFakeMcpServer() {
  const registerCapabilities = sinon.stub<[Record<string, unknown>], void>();
  const sendPromptListChanged = sinon.stub<[], void>();
  const prompts: FakePrompt[] = [];

  const registerPrompt = sinon.stub();
  registerPrompt.callsFake(
    (
      name: string,
      config: { title?: string; description?: string },
      cb: () => unknown
    ) => {
      const prompt: FakePrompt = {
        name,
        title: config.title,
        description: config.description,
        removed: false,
        updates: 0,
        callback: cb,
      };
      // The real RegisteredPrompt has `.remove()` / `.update()` on the
      // returned object; we mimic that.
      const handle = {
        remove() {
          prompt.removed = true;
        },
        update(updates: {
          title?: string;
          description?: string;
          callback?: () => unknown;
        }) {
          prompt.updates += 1;
          if (updates.title !== undefined) prompt.title = updates.title;
          if (updates.description !== undefined)
            prompt.description = updates.description;
          if (updates.callback !== undefined)
            prompt.callback = updates.callback;
        },
      };
      prompts.push(prompt);
      return handle;
    }
  );

  const mcpServer = {
    server: { registerCapabilities },
    registerPrompt,
    sendPromptListChanged,
  } as unknown as McpServer;

  return {
    mcpServer,
    registerCapabilities,
    registerPrompt,
    sendPromptListChanged,
    prompts,
  };
}

function queryItem(overrides: Partial<SavedQueryItem> = {}): SavedQueryItem {
  return {
    type: 'query',
    id: 'q1',
    namespace: 'a.b',
    name: 'My Query',
    description: 'desc',
    authoredBy: 'human',
    mcpPromptName: 'my-query',
    ...overrides,
  } as SavedQueryItem;
}

function aggItem(overrides: Partial<SavedQueryItem> = {}): SavedQueryItem {
  return {
    type: 'aggregation',
    id: 'a1',
    namespace: 'a.b',
    name: 'My Agg',
    description: 'desc',
    authoredBy: 'human',
    mcpPromptName: 'my-agg',
    pipelineText: '[{ $match: { x: 1 } }]',
    ...overrides,
  };
}

describe('SavedQueryPromptsRegistry', function () {
  it('always advertises prompts.listChanged capability on construction', function () {
    const fake = makeFakeMcpServer();
    new SavedQueryPromptsRegistry(fake.mcpServer, () => Promise.resolve([]));
    expect(fake.registerCapabilities.callCount).to.equal(1);
    expect(fake.registerCapabilities.firstCall.args[0]).to.deep.equal({
      prompts: { listChanged: true },
    });
  });

  it('on first refresh: registers one prompt per item with mcpPromptName', async function () {
    const fake = makeFakeMcpServer();
    const reg = new SavedQueryPromptsRegistry(fake.mcpServer, () =>
      Promise.resolve([
        queryItem({ mcpPromptName: 'a' }),
        aggItem({ mcpPromptName: 'b' }),
        queryItem({ id: 'q2', mcpPromptName: undefined }), // skipped
      ])
    );
    const changed = await reg.refresh();
    expect(changed).to.equal(true);
    expect(fake.registerPrompt.callCount).to.equal(2);
    const names = fake.registerPrompt.getCalls().map((c) => c.args[0]);
    expect(names).to.deep.equal(['a', 'b']);
    expect(fake.sendPromptListChanged.callCount).to.equal(1);
  });

  it('returns false (and does NOT fire list_changed) when nothing changed', async function () {
    const fake = makeFakeMcpServer();
    const items: SavedQueryItem[] = [queryItem()];
    const reg = new SavedQueryPromptsRegistry(fake.mcpServer, () =>
      Promise.resolve(items)
    );
    await reg.refresh();
    fake.sendPromptListChanged.resetHistory();
    fake.registerPrompt.resetHistory();
    const changed = await reg.refresh();
    expect(changed).to.equal(false);
    expect(fake.registerPrompt.callCount).to.equal(0);
    expect(fake.sendPromptListChanged.callCount).to.equal(0);
  });

  it('removes prompts whose item disappeared from the catalog', async function () {
    const fake = makeFakeMcpServer();
    let items: SavedQueryItem[] = [
      queryItem({ mcpPromptName: 'a' }),
      queryItem({ id: 'q2', mcpPromptName: 'b' }),
    ];
    const reg = new SavedQueryPromptsRegistry(fake.mcpServer, () =>
      Promise.resolve(items)
    );
    await reg.refresh();
    fake.sendPromptListChanged.resetHistory();
    // Drop the second one.
    items = [queryItem({ mcpPromptName: 'a' })];
    const changed = await reg.refresh();
    expect(changed).to.equal(true);
    const removed = fake.prompts.find((p) => p.name === 'b');
    expect(removed?.removed).to.equal(true);
    expect(fake.sendPromptListChanged.callCount).to.equal(1);
  });

  it('removes prompts whose mcpPromptName was cleared (but item still exists)', async function () {
    const fake = makeFakeMcpServer();
    let items: SavedQueryItem[] = [queryItem({ mcpPromptName: 'a' })];
    const reg = new SavedQueryPromptsRegistry(fake.mcpServer, () =>
      Promise.resolve(items)
    );
    await reg.refresh();
    items = [queryItem({ mcpPromptName: undefined })];
    const changed = await reg.refresh();
    expect(changed).to.equal(true);
    expect(fake.prompts[0].removed).to.equal(true);
  });

  it('updates a prompt in place when its body or description changes', async function () {
    const fake = makeFakeMcpServer();
    let items: SavedQueryItem[] = [
      queryItem({ description: 'first', filter: { x: 1 } }),
    ];
    const reg = new SavedQueryPromptsRegistry(fake.mcpServer, () =>
      Promise.resolve(items)
    );
    await reg.refresh();
    fake.sendPromptListChanged.resetHistory();
    fake.registerPrompt.resetHistory();
    items = [queryItem({ description: 'second', filter: { x: 1 } })];
    const changed = await reg.refresh();
    expect(changed).to.equal(true);
    // No new prompt registered — the existing one was updated.
    expect(fake.registerPrompt.callCount).to.equal(0);
    expect(fake.prompts[0].updates).to.equal(1);
    expect(fake.prompts[0].description).to.equal('second');
    expect(fake.sendPromptListChanged.callCount).to.equal(1);
  });

  it('does NOT update when description and body are byte-identical', async function () {
    const fake = makeFakeMcpServer();
    const items: SavedQueryItem[] = [queryItem()];
    const reg = new SavedQueryPromptsRegistry(fake.mcpServer, () =>
      Promise.resolve(items)
    );
    await reg.refresh();
    const updatesBefore = fake.prompts[0].updates;
    await reg.refresh();
    expect(fake.prompts[0].updates).to.equal(updatesBefore);
  });

  it('handles a rename (same id, different mcpPromptName) as remove-old + add-new', async function () {
    const fake = makeFakeMcpServer();
    let items: SavedQueryItem[] = [queryItem({ mcpPromptName: 'old-name' })];
    const reg = new SavedQueryPromptsRegistry(fake.mcpServer, () =>
      Promise.resolve(items)
    );
    await reg.refresh();
    items = [queryItem({ mcpPromptName: 'new-name' })];
    const changed = await reg.refresh();
    expect(changed).to.equal(true);
    const oldPrompt = fake.prompts.find((p) => p.name === 'old-name');
    const newPrompt = fake.prompts.find((p) => p.name === 'new-name');
    expect(oldPrompt?.removed).to.equal(true);
    expect(newPrompt).to.exist;
    expect(newPrompt?.removed).to.equal(false);
  });
});

describe('formatPromptBody', function () {
  // The body text is the user-turn we hand to the AI when the slash
  // command fires. Wording determines whether the AI picks the right
  // execution tool and doesn't rewrite the query — both load-bearing.
  describe('aggregation', function () {
    it('names the aggregate tool and inlines the pipeline verbatim', function () {
      const body = formatPromptBody(
        aggItem({ pipelineText: '[{ $match: { genre: "Action" } }]' })
      );
      expect(body).to.match(/Tool to use: aggregate/);
      expect(body).to.include('{ $match: { genre: "Action" } }');
    });

    it('tells the AI not to modify the pipeline', function () {
      expect(formatPromptBody(aggItem())).to.match(/Do not modify it/);
    });

    it('includes the description so the AI knows the intent', function () {
      const body = formatPromptBody(
        aggItem({ description: 'count per genre' })
      );
      expect(body).to.match(/count per genre/);
    });
  });

  describe('query', function () {
    it('names the find tool', function () {
      expect(formatPromptBody(queryItem())).to.match(/Tool to use: find/);
    });

    it('only includes fields that were actually saved', function () {
      const body = formatPromptBody(
        queryItem({ filter: { tier: 'enterprise' }, limit: 10 })
      );
      expect(body).to.match(/filter:/);
      expect(body).to.match(/limit:/);
      expect(body).to.not.match(/projection:/);
      expect(body).to.not.match(/sort:/);
      expect(body).to.not.match(/skip:/);
    });

    it('produces a sensible body for a "find with no filter" saved query', function () {
      const body = formatPromptBody(queryItem({ filter: undefined }));
      expect(body).to.match(/find with empty filter|no body/);
    });

    it('serializes filter values as JSON', function () {
      const body = formatPromptBody(
        queryItem({
          filter: { year: { $gte: 2020 } },
          sort: { year: -1 },
        })
      );
      expect(body).to.include('"$gte":2020');
      expect(body).to.include('"year":-1');
    });
  });
});
