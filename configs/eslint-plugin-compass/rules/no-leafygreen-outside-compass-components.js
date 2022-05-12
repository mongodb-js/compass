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

/** @type {Map<string, string> & { findClosest(key: string): string | undefined }} */
const PackageNameMap = new (class extends Map {
  /**
   * @param {string} key
   * @returns {string | undefined}
   */
  findClosest(key) {
    const closest = [...this.keys()]
      .sort((a, b) => {
        return b.length - a.length;
      })
      .find((path) => {
        return key.startsWith(path);
      });
    return this.get(closest);
  }
})();

/**
 * @param {string} dirname
 * @returns {string | null}
 */
function getPackageNameForDirname(dirname) {
  if (!dirname || dirname === '/') {
    return null;
  }
  const maybeName = PackageNameMap.findClosest(dirname);
  if (maybeName) {
    return maybeName;
  }
  try {
    const { name } = require(path.join(dirname, 'package.json'));
    PackageNameMap.set(dirname, name);
    return name;
  } catch {
    return getPackageNameForDirname(path.resolve(dirname, '..'));
  }
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
      return arg.value === libName;
    } else {
      return libName.test(arg.value);
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

    schema: [
      {
        type: 'object',
        properties: {
          // Allows to override CWD for testing purposes
          cwd: { type: 'string' },
        },
      },
    ],
  },
  create(context) {
    const options = {
      cwd: context.getCwd(),
      ...context.options[0],
    };

    // Physical filenames like `<text>` or `<input>` indicate programmatic usage
    // with no custom filename provided
    //
    // See: https://eslint.org/docs/developer-guide/working-with-rules#the-context-object
    const dirname = /^<.+?>$/.test(context.getPhysicalFilename())
      ? options.cwd
      : path.dirname(context.getPhysicalFilename());

    const packageName = getPackageNameForDirname(dirname);

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
        if (isRequireSourceEquals(/^@leafygreen-ui/, node)) {
          reportLeafygreenUsage(context, node, node.arguments[0]);
        }
      },
    };
  },
};
