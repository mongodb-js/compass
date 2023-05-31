const EXCLUDED_MONGODB_HOSTS = [
  'compass-maps.mongodb.com',
  'evergreen.mongodb.com',
  'downloads.mongodb.com',
  'cloud.mongodb.com',
];

const isMongodbURL = (str) => {
  try {
    const url = new URL(str);
    return (
      url.hostname.endsWith('mongodb.com') &&
      !EXCLUDED_MONGODB_HOSTS.includes(url.hostname)
    );
  } catch (error) {
    return false;
  }
};

/**
 * A template string is converted to a list of quasis and a list of expressions
 * A quasi is a static source string that surrounds a template expression.
 *  `${name}` => [Quasi(''), TemplateExpression('name'), Quasi('')]
 * We make use of this information to reconstruct the raw template string
 */
const templateNodeToString = (node) => {
  const { quasis, expressions } = node;
  let templateString = '';

  for (let i = 0; i < quasis.length; i++) {
    templateString += quasis[i].value.raw;
    if (i < expressions.length) {
      templateString += '${' + expressions[i].name + '}';
    }
  }

  return templateString;
};

const checkForMissingSearchParams = (urlString) => {
  const url = new URL(urlString);
  const missingParams = [];
  if (url.searchParams.get('utm_source') !== 'compass') {
    url.searchParams.set('utm_source', 'compass');
    missingParams.push('utm_source=compass');
  }

  if (url.searchParams.get('utm_medium') !== 'product') {
    url.searchParams.set('utm_medium', 'product');
    missingParams.push('utm_medium=product');
  }

  return { url, missingParams };
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
    return {
      Literal(node) {
        if (typeof node.value === 'string' && isMongodbURL(node.value)) {
          const { url: urlWithUtmParams, missingParams } =
            checkForMissingSearchParams(node.value);
          if (missingParams.length) {
            context.report({
              node,
              message: `URL does not contain ${missingParams.join(', ')}`,
              suggest: [
                {
                  desc: `Add ${missingParams.join(', ')}`,
                  fix(fixer) {
                    return fixer.replaceText(
                      node,
                      `'${urlWithUtmParams.toString()}'`
                    );
                  },
                },
              ],
            });
          }
        }
      },
      TemplateLiteral(node) {
        const templateString = templateNodeToString(node);
        if (isMongodbURL(templateString)) {
          const { url: urlWithUtmParams, missingParams } =
            checkForMissingSearchParams(templateString);
          if (missingParams.length) {
            const fixedString = decodeURI(`\`${urlWithUtmParams.toString()}\``);
            context.report({
              node,
              message: `URL does not contain ${missingParams.join(', ')}`,
              suggest: [
                {
                  desc: `Add ${missingParams.join(', ')}`,
                  fix(fixer) {
                    return fixer.replaceText(node, fixedString);
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
