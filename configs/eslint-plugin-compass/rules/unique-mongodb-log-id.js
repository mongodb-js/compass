const path = require('path');
const { spawnSync } = require('child_process');

/**
 * @type {Map<string, number[]>}
 */
const MongoLogIdUsageMap = new Map();

/**
 * @type {Map<number, boolean>}
 */
const UniqueIdsDuplicatedMap = new Map();

const idRegex = /mongoLogId\(([0-9_]+)\)(:?.+?\/\/\s+?!dupedLogId)?/;
const dupedLogIdRegex = /\/\/\s+?!dupedLogId/;
const ignoreFileRegex = /\.(spec|test)\.(js|jsx|ts|tsx)$/;

function updateUniqueIdsDuplicatedMap() {
  UniqueIdsDuplicatedMap.clear();

  for (const idGroup of MongoLogIdUsageMap.values()) {
    for (const id of idGroup) {
      UniqueIdsDuplicatedMap.set(id, UniqueIdsDuplicatedMap.has(id));
    }
  }
}

/**
 *
 * @param {string} filePath
 * @param {import('eslint').SourceCode} source
 */
function updateMongoLogIdUsageMapFromSource(filePath, source) {
  MongoLogIdUsageMap.delete(filePath);

  for (const [match, group] of source
    .getText()
    .matchAll(new RegExp(idRegex, 'g'))) {
    if (dupedLogIdRegex.test(match)) {
      continue;
    }
    const id = Number(group.replace(/_/g, ''));
    if (MongoLogIdUsageMap.has(filePath)) {
      MongoLogIdUsageMap.get(filePath).push(id);
    } else {
      MongoLogIdUsageMap.set(filePath, [id]);
    }
  }

  updateUniqueIdsDuplicatedMap();
}

/**
 *
 * @param {string=} cwd
 */
function updateMongoLogIdUsageMapFromGit(cwd = process.cwd()) {
  const { stdout } = spawnSync(
    'git',
    ['grep', '--untracked', '-e', 'mongoLogId([0-9_]\\{1,\\})'],
    { cwd }
  );

  const matches = stdout.toString().trim();

  if (!matches) {
    return;
  }

  for (const line of matches.split('\n')) {
    const [filePath, match] = line.split(':');

    if (ignoreFileRegex.test(filePath)) {
      continue;
    }

    if (/\/\/\s+?!dupedLogId/.test(match)) {
      return;
    }

    const absPath = path.resolve(cwd, filePath);

    const [, group] = idRegex.exec(match);

    const id = Number(group.replace(/_/g, ''));

    if (MongoLogIdUsageMap.has(absPath)) {
      MongoLogIdUsageMap.get(absPath).push(id);
    } else {
      MongoLogIdUsageMap.set(absPath, [id]);
    }
  }

  updateUniqueIdsDuplicatedMap();
}

function getNextAvailableId(pretty = true) {
  const next = Math.max(...UniqueIdsDuplicatedMap.keys()) + 1;
  if (pretty) {
    return String(next).replace(/(.)(?=(.{3})+$)/g, '$1_');
  }
  return next;
}

function reportWrongIdArgument(context, arg, message) {
  return context.report({
    node: arg,
    message,
    data: { id: arg.raw },
    suggest: [
      {
        desc: 'Use next available id',
        fix(fixer) {
          return fixer.replaceText(arg, getNextAvailableId());
        },
      },
    ],
  });
}

/**
 *
 * @param {import('estree').CallExpression & import('eslint').Rule.NodeParentExtension} node
 * @param {ReturnType<import('eslint').SourceCode['getAllComments']>} comments
 */
function getDuplicateIdMarker(node, comments) {
  return comments.find((comment) => {
    return (
      comment.type === 'Line' &&
      comment.loc.start.line === node.loc.end.line &&
      comment.loc.start.column > node.loc.end.column &&
      comment.value.trim() === '!dupedLogId'
    );
  });
}

let isFirstRun = true;

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'mongoLogId should be called with a unique identifier',
    },
    fixable: 'code',
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          root: {
            type: 'string',
          },
          min: {
            type: 'number',
          },
          max: {
            type: 'number',
          },
        },
      },
    ],
  },
  create(context) {
    const opts = {
      root: context.getCwd(),
      min: 1_001_000_000,
      max: 1_002_000_000,
      ...context.options[0],
    };

    if (isFirstRun) {
      // On the first run collect info for all the files in the monorepo using
      // git grep (this is relatively fast, but not fast enough to run it
      // constantly)
      updateMongoLogIdUsageMapFromGit(opts.root);
      isFirstRun = false;
    }

    const sourceCode = context.getSourceCode();
    const allComments = sourceCode.getAllComments();

    // Update usage map using source for the file you are currently working on.
    // This allows to cut some time on gathering the info and also works better
    // as changes will not be caught by git grep until saved, which this
    // checking the source approach avoids
    updateMongoLogIdUsageMapFromSource(context.getFilename(), sourceCode);

    return {
      CallExpression(node) {
        if (node.callee.name === 'mongoLogId') {
          const maybeDupedIdMarker = getDuplicateIdMarker(node, allComments);

          const [arg] = node.arguments;

          if (!arg) {
            return;
          }

          const { type, value: id, raw } = arg;

          if (type !== 'Literal' || typeof id !== 'number') {
            return reportWrongIdArgument(
              context,
              arg,
              'Log id should be defined as number literal'
            );
          }

          if (id < opts.min || id >= opts.max) {
            return reportWrongIdArgument(
              context,
              arg,
              'Log id {{ id }} is out of the Compass log id range'
            );
          }

          if (maybeDupedIdMarker) {
            if (!UniqueIdsDuplicatedMap.has(id)) {
              context.report({
                node: maybeDupedIdMarker,
                data: { id: raw },
                message: 'Log id {{ id }} is not duplicated',
                suggest: [
                  {
                    desc: 'Remove comment',
                    fix(fixer) {
                      return fixer.remove(maybeDupedIdMarker);
                    },
                  },
                ],
              });
            }
            return;
          }

          if (UniqueIdsDuplicatedMap.get(id) === true) {
            return reportWrongIdArgument(
              context,
              arg,
              'Log id {{ id }} is duplicated'
            );
          }
        }
      },
    };
  },
};
