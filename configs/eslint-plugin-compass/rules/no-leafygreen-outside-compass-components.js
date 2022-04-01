const path = require('path');

/**
 *
 * @param {import('eslint').Rule.RuleContext} context
 * @param {*} node
 * @param {*} source
 */
function reportLeafygreenUsage(context, node, source) {
  context.report({
    node: node,
    message:
      'Using @leafygreen-ui directly outside @mongodb-js/compass-component package is not allowed',
    suggest: [
      {
        desc: 'Replace "{{ source }}" with "@mongodb-js/compass-components"',
        data: { source: source.value },
        fix(fixer) {
          return fixer.replaceText(source, '"@mongodb-js/compass-components"');
        },
      },
    ],
  });
}

const PackageNameMap = new Map();

/**
 * 
 * @param {string} cwd 
 * @returns 
 */
function getPackageNameFromCwd(cwd) {
  if (PackageNameMap.has(cwd)) {
    return PackageNameMap.get(cwd);
  }
  const packageJson = require(path.join(cwd, 'package.json'));
  PackageNameMap.set(cwd, packageJson.name);
  return packageJson.name;
}

/**
 *
 * @param {string|RegExp} libName
 * @param {import('estree').CallExpression & import('eslint').Rule.NodeParentExtension} node
 */
function isImportSourceEquals(libName, node) {
  if (typeof libName === 'string') {
    return node.source.value === 'string';
  } else {
    return libName.test(node.source.value);
  }
}

/**
 *
 * @param {string|RegExp} libName
 * @param {import('estree').ImportDeclaration & import('eslint').Rule.NodeParentExtension} node
 */
function isRequireSourceEquals(libName, node) {
  if (node.callee.name === 'require') {
    const [arg] = node.arguments;
    if (typeof libName === 'string') {
      return arg === 'string';
    } else {
      return libName.test(arg);
    }
  }
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallows using @leafygreen-ui imports outside of compass-components package',
    },
    fixable: 'code',
    hasSuggestions: true,
    schema: [], // no options
  },
  create(context) {
    const packageName = getPackageNameFromCwd(context.getCwd());

    const isCompassComponentsPackage =
      packageName === '@mongodb-js/compass-components';

    if (isCompassComponentsPackage) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        if (isImportSourceEquals(/^@leafygreen-ui/, node)) {
          reportLeafygreenUsage(context, node, node.source);
        }
      },
      CallExpression(node) {
        if (isRequireSourceEquals(/^leafygreen-ui/, node)) {
          reportLeafygreenUsage(context, node, node.arguments[0]);
        }
      },
    };
  },
};
