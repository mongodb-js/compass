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
 * Checks if a call is inside a react function.
 * This only checks for JSXExpressionContainers or an uppercase function name,
 * so it may miss some cases.
 * @param {Object} context - ESLint context.
 * @returns {boolean} - Whether we're inside a function.
 */
function isInsideReactFunction(context) {
  const ancestors = context.getAncestors();

  const hasJSXAncestor = ancestors.some(
    (ancestor) => ancestor.type === 'JSXExpressionContainer'
  );

  if (hasJSXAncestor) {
    return true;
  }

  const currentFunction = ancestors.find(
    (ancestor) =>
      ancestor.type === 'FunctionDeclaration' ||
      ancestor.type === 'FunctionExpression' ||
      ancestor.type === 'ArrowFunctionExpression'
  );
  if (currentFunction) {
    // If the function name starts with an uppercase letter maybe it's a React component.
    if (
      currentFunction.type === 'FunctionDeclaration' &&
      currentFunction.id &&
      /^[A-Z]/.test(currentFunction.id.name)
    ) {
      return true;
    }
  }
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
      // Check for dynamic css() calls in react rendering.
      CallExpression(node) {
        if (!isCssCall(node)) {
          return;
        }

        if (isInsideReactFunction(context)) {
          context.report({
            node,
            messageId: 'noInlineCSS',
          });
        }
      },
    };
  },
};
