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
  const builtins = violations.map((v) => v.request);
  // The module that actually did the importing, i.e. the last real module
  // before the `external "..."` leaf.
  const culprits = violations.map((v) => v.chain[v.chain.length - 2] ?? '?');
  const tree = renderTree(buildTree(violations.map((v) => v.chain)));

  return [
    'Node stdlib imports in renderer bundle',
    '======================================',
    `${violations.length} violations across ${
      new Set(builtins).size
    } distinct builtins.`,
    '',
    // Webpack creates one ExternalModule per distinct request, so counting
    // occurrences per builtin would always be 1. List them instead.
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
    tree,
    '',
  ].join('\n');
}

/**
 * Fails the build on any Node stdlib import, prefixed (`node:fs`) or bare
 * (`fs`). The renderer cannot resolve these, but the `electron-renderer`
 * target preset silently turns them into `ExternalModule`s rather than
 * erroring, so we inspect the built module list instead of hooking resolution.
 *
 * Reports once per compilation as a grouped tree rather than one error per
 * violation, so that shared ancestors are visible.
 */
class FailOnNodeStdlib {
  constructor({ reportPath } = {}) {
    this.reportPath = reportPath;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN, (compilation) => {
      compilation.hooks.afterChunks.tap(PLUGIN, () => {
        const violations = [];

        for (const module of compilation.modules) {
          const request = module.userRequest || module.request || '';
          if (BUILTINS.has(request)) {
            violations.push({
              request,
              chain: shortestPathToEntry(compilation, module),
            });
          }
        }

        if (violations.length === 0) {
          return;
        }

        const report = buildReport(violations);

        if (!this.reportPath) {
          compilation.errors.push(new Error(report));
          return;
        }

        fs.mkdirSync(path.dirname(this.reportPath), { recursive: true });
        fs.writeFileSync(this.reportPath, report);
        compilation.errors.push(
          new Error(
            `${violations.length} Node stdlib imports in renderer bundle. ` +
              `Full report: ${this.reportPath}`
          )
        );
      });
    });
  }
}

module.exports = { FailOnNodeStdlib };
