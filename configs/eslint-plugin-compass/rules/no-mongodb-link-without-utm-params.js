const isMongodbURL = (str) => {
  try {
    const url = new URL(str);
    return url.hostname.includes('mongodb');
  } catch (error) {
    return false;
  }
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Links pointing to *.mongodb.com must have utm_source=compass and utm_medium=product in query params',
    },
    fixable: 'code',
    hasSuggestions: true,
  },

  create(context) {
    const isTestFile = /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(
      context.getPhysicalFilename()
    );
    return {
      Literal(node) {
        if (
          !isTestFile &&
          typeof node.value === 'string' &&
          isMongodbURL(node.value)
        ) {
          const url = new URL(node.value);

          const missingParams = [];
          if (url.searchParams.get('utm_source') !== 'compass') {
            url.searchParams.set('utm_source', 'compass');
            missingParams.push('utm_source=compass');
          }

          if (url.searchParams.get('utm_medium') !== 'product') {
            url.searchParams.set('utm_medium', 'product');
            missingParams.push('utm_medium=product');
          }

          if (missingParams.length) {
            context.report({
              node,
              message: `URL does not contain ${missingParams.join(', ')}`,
              suggest: [
                {
                  desc: `Add ${missingParams.join(', ')}`,
                  fix(fixer) {
                    return fixer.replaceText(node, `'${url.toString()}'`);
                  },
                },
              ],
            });
          }
        }
      },
    };
  },
};
