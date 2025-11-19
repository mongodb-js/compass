'use strict';

/**
 * Checks if a node is an async function.
 * @param {Object} node - AST node to check.
 * @returns {boolean} - Whether the node is an async function.
 */
function isAsyncFunction(node) {
  return (
    node &&
    (node.type === 'ArrowFunctionExpression' ||
      node.type === 'FunctionExpression') &&
    node.async === true
  );
}

/**
 * Checks if a function might return a Promise.
 * @param {Object} node - AST node to check.
 * @returns {boolean} - Whether the node is a promise returning function.
 */
function mightReturnPromise(node) {
  if (!node || !node.body) {
    return false;
  }

  if (node.type === 'ArrowFunctionExpression' && node.expression) {
    const body = node.body;
    return (
      body.type === 'CallExpression' &&
      body.callee &&
      body.callee.type === 'MemberExpression' &&
      body.callee.object &&
      body.callee.object.name === 'Promise'
    );
  }

  return false;
}

/**
 * Checks if a MemberExpression matches the expect().to.throw pattern.
 * @param {Object} node - AST node to check.
 * @returns {Object|null} - The expect call node if matched, otherwise null.
 */
function checkExpectThrowPattern(node) {
  if (node.type !== 'MemberExpression' || node.property.name !== 'throw') {
    return null;
  }

  const toNode = node.object;
  if (
    !toNode ||
    toNode.type !== 'MemberExpression' ||
    toNode.property.name !== 'to'
  ) {
    return null;
  }

  const expectCall = toNode.object;
  if (
    !expectCall ||
    expectCall.type !== 'CallExpression' ||
    !expectCall.callee ||
    expectCall.callee.name !== 'expect'
  ) {
    return null;
  }

  return { expectCall };
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require invocation of expect().to.throw and disallow async functions',
    },
    messages: {
      throwNotInvoked:
        'expect().to.throw must be invoked with parentheses, e.g., expect(() => someFn()).to.throw()',
      asyncFunction:
        'expect().to.throw cannot be used with async functions or Promise-returning functions. Use expect().to.be.rejectedWith() for async code.',
    },
  },

  create(context) {
    return {
      MemberExpression(node) {
        const pattern = checkExpectThrowPattern(node);
        if (!pattern) {
          return;
        }

        const { expectCall } = pattern;
        const isInvoked = node.parent && node.parent.type === 'CallExpression';

        if (!isInvoked) {
          context.report({
            node,
            messageId: 'throwNotInvoked',
          });
          return;
        }

        if (expectCall.arguments.length > 0) {
          const firstArg = expectCall.arguments[0];

          if (isAsyncFunction(firstArg) || mightReturnPromise(firstArg)) {
            context.report({
              node: firstArg,
              messageId: 'asyncFunction',
            });
          }
        }
      },
    };
  },
};
