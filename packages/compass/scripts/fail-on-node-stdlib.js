'use strict';

const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');

const PLUGIN = 'FailOnNodeStdlib';

const BUILTINS = new Set(
  builtinModules.flatMap((name) => [name, `node:${name}`])
);

/**
 * Walks `moduleGraph` backwards from `module` to whichever entry pulled it in,
 * returning the shortest chain. BFS rather than DFS because a module is
 * typically reachable many ways and only the shortest chain is worth reading.
 */
function shortestPathToEntry(compilation, module) {
  const { moduleGraph, requestShortener } = compilation;
  const cameFrom = new Map([[module, null]]);
  const queue = [module];

  while (queue.length > 0) {
    const current = queue.shift();
    const origins = new Set();

    for (const connection of moduleGraph.getIncomingConnections(current)) {
      // A null originModule means the connection is an entrypoint, so
      // `current` is where the chain ends.
      if (!connection.originModule) {
        const chain = [];
        for (let at = current; at; at = cameFrom.get(at)) {
          chain.push(at.readableIdentifier(requestShortener));
        }
        return chain;
      }
      origins.add(connection.originModule);
    }

    for (const origin of origins) {
      if (!cameFrom.has(origin)) {
        cameFrom.set(origin, current);
        queue.push(origin);
      }
    }
  }

  return [module.readableIdentifier(requestShortener)];
}

/**
 * `readableIdentifier` paths are mostly repeated `node_modules` boilerplate,
 * which at tree depth 10+ pushes the meaningful part off the screen. Keeps the
 * owning package of a nested copy (`express` resolved under
 * `compass-generative-ai` is not the same module as the hoisted one).
 */
function shorten(label) {
  return label
    .replace(/^(\.\.\/)+node_modules\//, '')
    .replace(/^\.\.\/([^/]+)\/node_modules\//, '$1:')
    .replace(/^\.\.\//, '');
}

/** The npm package or workspace a module belongs to. */
function packageOf(label) {
  const nested = label.lastIndexOf('node_modules/');
  if (nested !== -1) {
    const rest = label.slice(nested + 'node_modules/'.length);
    const parts = rest.split('/');
    return parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
  }
  const workspace = /^\.\.\/([^/]+)\//.exec(label);
  return workspace ? workspace[1] : 'compass';
}

function makeNode(label) {
  return { label, children: new Map(), violations: 0 };
}

/**
 * Merges every import chain into one tree so that a module responsible for
 * many violations (a barrel file, a provider) shows up once with its
 * violations grouped beneath it, instead of being repeated per builtin.
 */
function buildTree(chains) {
  const root = makeNode('');

  for (const chain of chains) {
    let current = root;
    for (const segment of chain) {
      let child = current.children.get(segment);
      if (!child) {
        child = makeNode(segment);
        current.children.set(segment, child);
      }
      current = child;
    }
  }

  // Pre-order gives parents before children, so accumulating in reverse
  // propagates leaf counts up without recursion.
  const preOrder = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    preOrder.push(node);
    stack.push(...node.children.values());
  }
  for (let i = preOrder.length - 1; i >= 0; i--) {
    const node = preOrder[i];
    if (node.children.size === 0) {
      node.violations = 1;
      continue;
    }
    node.violations = 0;
    for (const child of node.children.values()) {
      node.violations += child.violations;
    }
  }

  return root;
}

/**
 * A run of single-child nodes carries no grouping information, so fold it onto
 * one line. Returns the label to print and the node whose children come next.
 */
function collapseChain(node) {
  const segments = [node.label];
  let current = node;
  while (current.children.size === 1) {
    const [only] = current.children.values();
    if (only.children.size === 0) {
      break;
    }
    segments.push(only.label);
    current = only;
  }
  return { label: segments.join(' > '), node: current };
}

function sortedChildren(node) {
  return [...node.children.values()].sort(
    (a, b) => b.violations - a.violations || a.label.localeCompare(b.label)
  );
}

function renderTree(root) {
  const lines = [];
  // Entries are pushed in reverse so that popping yields source order.
  const stack = sortedChildren(root)
    .map((child, index, all) => ({
      node: child,
      prefix: '',
      isLast: index === all.length - 1,
    }))
    .reverse();

  while (stack.length > 0) {
    const { node, prefix, isLast } = stack.pop();
    const { label: rawLabel, node: tail } = collapseChain(node);
    const label = rawLabel.split(' > ').map(shorten).join(' > ');
    const connector = prefix === '' ? '' : isLast ? '`- ' : '|- ';
    const count = tail.violations > 1 ? `  (${tail.violations})` : '';
    lines.push(`${prefix}${connector}${label}${count}`);

    const childPrefix =
      prefix === '' ? '  ' : prefix + (isLast ? '   ' : '|  ');
    const children = sortedChildren(tail);
    for (let i = children.length - 1; i >= 0; i--) {
      stack.push({
        node: children[i],
        prefix: childPrefix,
        isLast: i === children.length - 1,
      });
    }
  }

  return lines.join('\n');
}

function tally(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => `  ${String(count).padStart(3)}  ${value}`)
    .join('\n');
}

function buildReport(violations) {
  const required = violations.filter((v) => !v.optional);
  const optional = violations.filter((v) => v.optional);
  const builtins = required.map((v) => v.request);
  // The module that actually did the importing, i.e. the last real module
  // before the `external "..."` leaf.
  const culprits = required.map((v) => v.chain[v.chain.length - 2] ?? '?');

  const sections = [
    'Node stdlib imports in renderer bundle',
    '======================================',
    `${required.length} unguarded imports of ${
      new Set(builtins).size
    } distinct builtins, from ${new Set(culprits).size} modules.`,
    `${optional.length} further imports sit inside a try/catch and are` +
      ' reported separately below.',
    '',
    'BUILTINS',
    `  ${[...new Set(builtins)].sort().join(', ')}`,
    '',
    'BY PACKAGE',
    tally(culprits.map(packageOf)),
    '',
    'BY IMPORTING MODULE',
    tally(culprits.map(shorten)),
    '',
    'IMPORT TREE',
    renderTree(buildTree(required.map((v) => v.chain))),
    '',
  ];

  if (optional.length > 0) {
    sections.push(
      'OPTIONAL (inside try/catch -- these degrade gracefully)',
      '======================================================',
      tally(
        optional.map(
          (v) => `${shorten(v.chain[v.chain.length - 2] ?? '?')}  ->  ${v.request}`
        )
      ),
      ''
    );
  }

  return sections.join('\n');
}

/**
 * Reports every Node stdlib import, prefixed (`node:fs`) or bare (`fs`).
 * Warns by default; pass `failOnViolation` to make it fail the build. The renderer cannot resolve these, but the `electron-renderer`
 * target preset silently turns them into `ExternalModule`s rather than
 * erroring, so we inspect the built module list instead of hooking resolution.
 *
 * Reports once per compilation as a grouped tree rather than one entry per
 * violation, so that shared ancestors are visible.
 */
class FailOnNodeStdlib {
  constructor({ reportPath, failOnViolation = false } = {}) {
    this.reportPath = reportPath;
    // Reported as a warning by default: the remaining imports sit on code
    // paths the renderer does not take, so the bundle still runs. Flip this
    // on once the count reaches zero to keep it there.
    this.failOnViolation = failOnViolation;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN, (compilation) => {
      compilation.hooks.afterChunks.tap(PLUGIN, () => {
        const violations = [];
        const { moduleGraph } = compilation;

        for (const module of compilation.modules) {
          // A builtin shows up either as an ExternalModule (`request` set) or,
          // once `resolve.fallback` maps it to `false`, as a RawModule whose
          // identifier is `ignored|<context>|<request>`. Both mean the same
          // thing for us: renderer code reached for a Node builtin.
          let request = module.userRequest || module.request || '';
          if (!request) {
            const ignored = /^ignored\|.*\|(.+)$/.exec(module.identifier());
            if (ignored) {
              request = ignored[1];
            }
          }
          if (!BUILTINS.has(request)) {
            continue;
          }

          // Webpack collapses every import of a builtin into one
          // ExternalModule, so reporting a single path to it would name only
          // one of possibly many importers and hide the rest. Enumerate every
          // module that imports it instead: that is the real work list.
          // Webpack sets `dependency.optional` from `parser.scope.inTry`, so a
          // require inside a try/catch is distinguishable here. Those are the
          // feature-detection cases that degrade gracefully in a browser, so
          // they are reported separately rather than counted as work.
          const importers = new Map();
          for (const connection of moduleGraph.getIncomingConnections(module)) {
            if (!connection.originModule) {
              continue;
            }
            const optional = Boolean(connection.dependency?.optional);
            // A module may import the same builtin both ways; if any import is
            // unguarded, the importer still needs fixing.
            importers.set(
              connection.originModule,
              (importers.get(connection.originModule) ?? true) && optional
            );
          }

          if (importers.size === 0) {
            violations.push({
              request,
              optional: false,
              chain: [...shortestPathToEntry(compilation, module), request],
            });
            continue;
          }

          for (const [importer, optional] of importers) {
            violations.push({
              request,
              optional,
              chain: [
                ...shortestPathToEntry(compilation, importer),
                `external "${request}"${optional ? ' [optional]' : ''}`,
              ],
            });
          }
        }

        if (violations.length === 0) {
          return;
        }

        const required = violations.filter((v) => !v.optional);
        const report = buildReport(violations);

        const sink = this.failOnViolation
          ? compilation.errors
          : compilation.warnings;

        if (!this.reportPath) {
          sink.push(new Error(report));
          return;
        }

        fs.mkdirSync(path.dirname(this.reportPath), { recursive: true });
        fs.writeFileSync(this.reportPath, report);
        sink.push(
          new Error(
            `${required.length} unguarded Node stdlib imports in renderer ` +
              `bundle. Full report: ${this.reportPath}`
          )
        );
      });
    });
  }
}

module.exports = { FailOnNodeStdlib };
