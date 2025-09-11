'use strict';

/**
 * Checks if a node is a css() call from emotion.
 * @param {Object} node - AST node to check.
 * @returns {boolean} - Whether the node is a css() call.
 */
function isCssCall(node) {
  return (
    node &&
    node.type === 'CallExpression' &&
    node.callee &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'css'
  );
}

/**
 * Checks if a call is inside a function.
 * @param {Object} context - ESLint context.
 * @returns {boolean} - Whether we're inside a function.
 */
function isInsideFunction(context) {
  const ancestors = context.getAncestors();

  return ancestors.some(
    (ancestor) =>
      ancestor.type === 'FunctionDeclaration' ||
      ancestor.type === 'FunctionExpression' ||
      ancestor.type === 'ArrowFunctionExpression'
  );
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow dynamic emotion css() calls in render methods',
    },
    messages: {
      noInlineCSS:
        "Don't use a dynamic css() call in the render method, this creates a new class name every time component updates and is not performant. Static styles can be defined with css outside of render, dynamic should be passed through the style prop.",
    },
  },

  create(context) {
    return {
      // Check for css() calls in functions.
      CallExpression(node) {
        if (!isCssCall(node)) {
          return;
        }

        if (isInsideFunction(context)) {
          context.report({
            node,
            messageId: 'noInlineCSS',
          });
        }
      },
    };
  },
};
