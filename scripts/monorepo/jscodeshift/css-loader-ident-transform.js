/**
 * Updates deprecated `options.localIdentName` to `options.modules.localIdentName`
 * in all webpack configurations
 * 
 * @before
 * 
 * module.exports = {
 *   ...
 *   module: {
 *     rules: [
 *       {
 *         loader: 'css-loader',
 *         options: {
 *           modules: true,
 *           localIdentName: 'Plugin__[hash]'
 *         }
 *       }
 *     ]
 *   }
 * }
 * 
 * @after
 * 
 * module.exports = {
 *   ...
 *   module: {
 *     rules: [
 *       {
 *         loader: 'css-loader',
 *         options: {
 *           modules: {
 *             localIdentName: 'Plugin__[hash]'
 *           }
 *         }
 *       }
 *     ]
 *   }
 * }
 */
module.exports = function transformer(file, api) {
  const j = api.jscodeshift;

  const kNotAnArg = Symbol('kNotAnArg');

  function findProp(obj, name, value = kNotAnArg) {
    return obj.properties.find(
      (prop) =>
        prop.key.name === name &&
        (value === kNotAnArg ? true : prop.value.value === value)
    );
  }

  return j(file.source)
    .find(j.ObjectExpression)
    .forEach((path) => {
      if (findProp(path.node, 'loader', 'css-loader')) {
        const options = findProp(path.node, 'options');

        if (options) {
          const localIdentName = findProp(options.value, 'localIdentName');
          const modules = findProp(options.value, 'modules');

          if (localIdentName) {
            options.value.properties = options.value.properties
              .filter(
                (property) =>
                  [localIdentName, modules].includes(property) === false
              )
              .concat(
                j.property(
                  'init',
                  j.identifier('modules'),
                  j.objectExpression([localIdentName])
                )
              );
          }
        }
      }
    })
    .toSource();
};
