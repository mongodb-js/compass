/**
 * Manual benchmark for AssistantChat rendering performance.
 *
 * Run with: npm run benchmark-chat -w @mongodb-js/compass-assistant
 *
 * Numbers are only comparable against another run on the same machine, not as
 * absolute budgets. jsdom does no layout or paint, so this covers React
 * reconciliation and markdown parsing only; use `benchmark-chat-electron` for
 * style and layout costs.
 *
 * Blocking is sampled with a watchdog timer rather than `React.Profiler`, whose
 * `actualDuration` charges a parent for subtrees React skipped and so cannot
 * see a `React.memo` bailout.
 *
 * Streaming scenarios run twice: against `AssistantChat`, and against a
 * harness rendering nothing but the streaming message's markdown. The latter is
 * a floor on the update cost, so `chat overhead` is what `AssistantChat` adds
 * on top. Check `renders` against `md renders` first — the throttle is
 * time-based, so a slower variant takes more updates to stream the same text,
 * and once the counts diverge the split is directional only.
 */
import React from 'react';
import { render, act } from '@mongodb-js/testing-library-compass';
import { LgChatMessage } from '@mongodb-js/compass-components';
import { AssistantChat } from '../src/components/assistant-chat';
import {
  AssistantActionsContext,
  type AssistantMessage,
} from '../src/compass-assistant-provider';
import { Chat } from '../src/@ai-sdk/react/chat-react';
import { useChat } from '../src/@ai-sdk/react/use-chat';
import { ToolsControllerProvider } from '@mongodb-js/compass-generative-ai/provider';
import type { ChatState, ToolUIPart } from 'ai';
import type { AtlasAdminApiService } from '@mongodb-js/atlas-admin-api/provider';
import { AtlasAuthPlugin } from '@mongodb-js/atlas-service/renderer';

const RUNS = 3;

/** Streaming cadence, in ms between tokens. */
const TYPICAL_MODEL = 25;
const FAST_MODEL = 6;

/** Tokens are roughly four characters. */
const TOKEN_CHARS = 4;

const WATCHDOG_TICK_MS = 4;
/** Ignore gaps within timer jitter so only real blocking is counted. */
const BLOCK_FLOOR_MS = WATCHDOG_TICK_MS * 2;

const QUESTIONS = [
  'How do I speed up a slow find query on my movies collection?',
  'What is the difference between $lookup and an embedded document?',
  'Why is my aggregation running out of memory?',
  'How should I model a one-to-many relationship?',
  'What does the COLLSCAN stage in my explain output mean?',
];

const ANSWER = `To speed up that query you want a compound index whose field order matches
your predicates.

## Create the index

\`\`\`javascript
db.movies.createIndex({ year: 1, 'imdb.rating': -1 });
\`\`\`

MongoDB follows the **ESR rule** when choosing a compound index:

1. **Equality** fields first
2. **Sort** fields next
3. **Range** fields last

## Confirm that it is used

Run the query with \`explain\` and look at the winning plan:

\`\`\`javascript
db.movies
  .find({ year: 2015 })
  .sort({ 'imdb.rating': -1 })
  .explain('executionStats');
\`\`\`

| Stage | What it means |
| --- | --- |
| \`IXSCAN\` | The index was used |
| \`COLLSCAN\` | Every document was read |
| \`SORT\` | The sort happened in memory |

> A \`SORT\` stage means the index order does not match your sort.

See the [compound index docs](https://mongodb.com/docs/manual/core/index-compound/).
`;

const LONG_ANSWER = ANSWER.repeat(8);

/** A code fence that never closes, so every chunk reparses the whole block. */
const OPEN_FENCE_ANSWER = `Here is the full pipeline, stage by stage.

\`\`\`javascript
db.movies.aggregate([
${`  { $lookup: { from: 'comments', localField: '_id', foreignField: 'movie_id', as: 'comments' } },\n`.repeat(
  70
)}`;

function userMessage(id: string, text: string): AssistantMessage {
  return { id, role: 'user', parts: [{ type: 'text', text }] };
}

function assistantMessage(
  id: string,
  text: string,
  extraParts: AssistantMessage['parts'] = []
): AssistantMessage {
  return {
    id,
    role: 'assistant',
    parts: [{ type: 'text', text }, ...extraParts],
  };
}

function citations(count: number): AssistantMessage['parts'] {
  return Array.from({ length: count }, (_, index) => ({
    type: 'source-url' as const,
    sourceId: `source-${index}`,
    url: `https://mongodb.com/docs/manual/core/index-compound-${index}`,
    title: `Compound Indexes — MongoDB Manual (${index})`,
  }));
}

function toolCall(id: string): ToolUIPart {
  return {
    type: 'tool-list-databases',
    toolCallId: id,
    state: 'output-available',
    input: {},
    output: { databases: ['admin', 'config', 'local', 'sample_mflix'] },
  };
}

function history(turns: number): AssistantMessage[] {
  return Array.from({ length: turns }, (_, turn) => [
    userMessage(`user-${turn}`, QUESTIONS[turn % QUESTIONS.length]),
    assistantMessage(`assistant-${turn}`, ANSWER),
  ]).flat();
}

type Scenario = {
  name: string;
  turns: number;
  answer?: {
    text: string;
    cadenceMs: number;
    tokenChars?: number;
    parts?: AssistantMessage['parts'];
  };
};

const scenarios: Scenario[] = [
  { name: 'open drawer · 10 turns', turns: 5 },
  { name: 'open drawer · 40 turns', turns: 20 },
  { name: 'open drawer · 100 turns', turns: 50 },
  {
    name: 'first answer · empty chat',
    turns: 0,
    answer: { text: ANSWER, cadenceMs: TYPICAL_MODEL },
  },
  {
    name: 'answer · 10 turns',
    turns: 5,
    answer: { text: ANSWER, cadenceMs: TYPICAL_MODEL },
  },
  {
    name: 'answer · 40 turns',
    turns: 20,
    answer: { text: ANSWER, cadenceMs: FAST_MODEL },
  },
  {
    name: 'answer · 100 turns',
    turns: 50,
    answer: { text: ANSWER, cadenceMs: FAST_MODEL },
  },
  {
    name: 'answer with 8 citations · 10 turns',
    turns: 5,
    answer: { text: ANSWER, cadenceMs: FAST_MODEL, parts: citations(8) },
  },
  {
    name: 'answer after a tool call · 10 turns',
    turns: 5,
    answer: {
      text: ANSWER,
      cadenceMs: FAST_MODEL,
      parts: [toolCall('tool-call-1')],
    },
  },
  {
    name: 'long answer (8kb) · 20 turns',
    turns: 10,
    answer: { text: LONG_ANSWER, cadenceMs: FAST_MODEL, tokenChars: 16 },
  },
  {
    name: 'open code fence (7kb) · 20 turns',
    turns: 10,
    answer: { text: OPEN_FENCE_ANSWER, cadenceMs: FAST_MODEL, tokenChars: 16 },
  },
];

// Set BENCHMARK_SCENARIO to a substring to run a single scenario.
const selectedScenarios = process.env.BENCHMARK_SCENARIO
  ? scenarios.filter((scenario) =>
      scenario.name.includes(process.env.BENCHMARK_SCENARIO as string)
    )
  : scenarios;

const AtlasLoginPlugin = AtlasAuthPlugin.withMockServices({});

const assistantActions = {
  atlasAdminApi: {
    getSystemStatus: () => Promise.resolve({}),
  } as unknown as AtlasAdminApiService,
};

const { Message } = LgChatMessage;

/**
 * Renders only the streaming message's markdown. Subscribing through `useChat`
 * keeps the throttled update cadence identical to `AssistantChat`, so the
 * comparison isolates rendering rather than how often React is woken up.
 */
function MarkdownOnlyChat({ chat }: { chat: Chat<AssistantMessage> }) {
  const { messages } = useChat<AssistantMessage>({ chat });
  const last = messages[messages.length - 1];
  const body = (last?.parts ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');

  return <Message sourceType="markdown" isSender={false} messageBody={body} />;
}

/**
 * `AbstractChat` keeps its state protected, but we want the mutators the real
 * stream uses — `replaceMessage` and its clone, not the `messages` setter.
 */
function stateOf(chat: Chat<AssistantMessage>) {
  return (chat as unknown as { state: ChatState<AssistantMessage> }).state;
}

function TestProviders({ children }: React.PropsWithChildren<unknown>) {
  return (
    <ToolsControllerProvider>
      <AtlasLoginPlugin>
        <AssistantActionsContext.Provider value={assistantActions}>
          {children}
        </AssistantActionsContext.Provider>
      </AtlasLoginPlugin>
    </ToolsControllerProvider>
  );
}

function delay(timeout: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

/** Samples how late a fixed-interval timer fires, i.e. how long the main
 * thread was too busy to respond to the user. */
function startWatchdog() {
  const blocks: number[] = [];
  let last = performance.now();
  const timer = setInterval(() => {
    const now = performance.now();
    blocks.push(now - last - WATCHDOG_TICK_MS);
    last = now;
  }, WATCHDOG_TICK_MS);

  return () => {
    clearInterval(timer);
    return blocks.filter((block) => block >= BLOCK_FLOOR_MS);
  };
}

type Timings = {
  mount: number;
  renders: number;
  blocked: number;
  worst: number;
  lag: number;
  clone: number;
};

/** `chat` renders the real UI; `markdown` renders only the streaming body. */
type Variant = 'chat' | 'markdown';

async function runScenario(
  scenario: Scenario,
  variant: Variant = 'chat'
): Promise<Timings> {
  const messages = history(scenario.turns);
  const chat = new Chat<AssistantMessage>({ messages });
  let renders = 0;

  const mountStart = performance.now();
  const { unmount } = render(
    <TestProviders>
      <React.Profiler
        id="assistant-chat"
        onRender={(_id, phase) => {
          if (phase !== 'mount') {
            renders++;
          }
        }}
      >
        {variant === 'chat' ? (
          <AssistantChat chat={chat} hasNonGenuineConnections={false} />
        ) : (
          <MarkdownOnlyChat chat={chat} />
        )}
      </React.Profiler>
    </TestProviders>
  );
  document.body.getBoundingClientRect();
  const mount = performance.now() - mountStart;

  const timings: Timings = {
    mount,
    renders: 0,
    blocked: 0,
    worst: 0,
    lag: 0,
    clone: 0,
  };

  if (scenario.answer) {
    const {
      text,
      cadenceMs,
      tokenChars = TOKEN_CHARS,
      parts = [],
    } = scenario.answer;
    const tokens = Math.ceil(text.length / tokenChars);
    const state = stateOf(chat);
    // The stream appends the message once then rewrites it in place, so
    // everything after the first token goes through `replaceMessage`.
    const index = messages.length;
    let clone = 0;

    const stopWatchdog = startWatchdog();
    const streamStart = performance.now();

    await act(async () => {
      for (let token = 1; token <= tokens; token++) {
        const message = assistantMessage(
          'streaming',
          text.slice(0, token * tokenChars),
          parts
        );

        if (token === 1) {
          state.pushMessage(message);
        } else {
          // Time an equivalent clone so the report can separate
          // `replaceMessage`'s clone from the render it triggers.
          const cloneStart = performance.now();
          structuredClone(message);
          clone += performance.now() - cloneStart;
          state.replaceMessage(index, message);
        }

        document.body.getBoundingClientRect();
        await delay(cadenceMs);
      }
    });

    const blocks = stopWatchdog();
    timings.lag = performance.now() - streamStart - tokens * cadenceMs;
    timings.blocked = blocks.reduce((total, block) => total + block, 0);
    timings.worst = Math.max(0, ...blocks);
    timings.renders = renders;
    timings.clone = clone;
  }

  unmount();
  return timings;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function ms(value: number) {
  return `${value.toFixed(1)}ms`;
}

type Row = Record<string, string | number>;

/**
 * Chromium's `console.table` is rendered by devtools, so it survives neither
 * electron-mocha's console forwarding nor a piped stdout. We format our own.
 */
function formatTable(rows: Row[]) {
  const columns = Object.keys(rows[0] ?? {});
  const widths = columns.map((column) =>
    Math.max(column.length, ...rows.map((row) => String(row[column]).length))
  );
  const line = (cells: string[]) =>
    cells.map((cell, index) => cell.padEnd(widths[index])).join('  ');

  return [
    line(columns),
    widths.map((width) => '-'.repeat(width)).join('  '),
    ...rows.map((row) => line(columns.map((column) => String(row[column])))),
  ].join('\n');
}

/* eslint-disable no-console */
const SUPPRESSED_BOOLEAN_ATTRIBUTES = ['inline', 'ordered'];

function isSuppressed(args: unknown[]) {
  if (typeof args[0] !== 'string') {
    return false;
  }
  // Streaming a partial code fence exposes truncated language names.
  if (args[0].includes('Unknown code language')) {
    return true;
  }
  return (
    args[0].includes('for a non-boolean attribute') &&
    args.some(
      (arg) =>
        typeof arg === 'string' && SUPPRESSED_BOOLEAN_ATTRIBUTES.includes(arg)
    )
  );
}

function suppressExpectedWarnings() {
  const methods = ['error', 'warn', 'log'] as const;
  const originals = methods.map((method) => {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      if (!isSuppressed(args)) {
        original(...args);
      }
    };
    return original;
  });
  return () => {
    methods.forEach((method, index) => {
      console[method] = originals[index];
    });
  };
}

async function runBenchmark() {
  const rows: Row[] = [];

  for (const scenario of selectedScenarios) {
    const sample = async (variant: Variant) => {
      // Discard a warmup run so JIT and module init do not land in the sample.
      await runScenario(scenario, variant);

      const runs: Timings[] = [];
      for (let run = 0; run < RUNS; run++) {
        runs.push(await runScenario(scenario, variant));
      }
      return runs;
    };

    const runs = await sample('chat');

    if (!scenario.answer) {
      rows.push({
        scenario: scenario.name,
        mount: ms(median(runs.map((run) => run.mount))),
        renders: '-',
        blocked: '-',
        markdown: '-',
        'md renders': '-',
        clone: '-',
        'chat overhead': '-',
        'worst block': '-',
        'lag behind stream': '-',
      });
      continue;
    }

    const markdownRuns = await sample('markdown');
    const blocked = median(runs.map((run) => run.blocked));
    const markdown = median(markdownRuns.map((run) => run.blocked));

    rows.push({
      scenario: scenario.name,
      mount: ms(median(runs.map((run) => run.mount))),
      renders: median(runs.map((run) => run.renders)),
      blocked: ms(blocked),
      markdown: ms(markdown),
      // Should track `renders`; if it does not, the variants saw different
      // numbers of updates and are not comparable.
      'md renders': median(markdownRuns.map((run) => run.renders)),
      clone: ms(median(runs.map((run) => run.clone))),
      'chat overhead': ms(Math.max(0, blocked - markdown)),
      'worst block': ms(median(runs.map((run) => run.worst))),
      'lag behind stream': ms(median(runs.map((run) => run.lag))),
    });
  }

  console.log(
    `\nAssistantChat render benchmark (${RUNS} runs per scenario)\n\n` +
      formatTable(rows) +
      '\n\n' +
      'markdown: blocking with only the streaming body rendered.\n' +
      'clone: time in `structuredClone`, already counted in blocked.\n' +
      'chat overhead: blocked - markdown, everything AssistantChat adds.\n'
  );
}

// We use mocha to reuse the renderer/preferences test environment.
describe('AssistantChat render benchmark', function () {
  this.timeout(900_000);

  let restoreConsole: () => void;

  before(function () {
    restoreConsole = suppressExpectedWarnings();
  });

  after(function () {
    restoreConsole();
  });

  it('reports render timings', runBenchmark);
});
