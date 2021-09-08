function createLessLoaderTemplate(j, localIdentName) {
  return j.template.expression`{
    test: /\.less$/,
    use: [
      { loader: 'style-loader' },
      {
        loader: 'css-loader',
        options: {
          modules: {
            // Based on file name
            auto: true,
            localIdentName: ${localIdentName}
          }
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          plugins: function () {
            return [project.plugin.autoprefixer];
          }
        }
      },
      {
        loader: 'less-loader',
        options: {
          lessOptions: {
            modifyVars: {
              // Only affects dev build (standalone plugin playground), required
              // so that font-awesome can correctly resolve image paths relative
              // to the compass
              'compass-fonts-path': '../fonts',
              'compass-images-path': '../images',
              'fa-font-path': path.dirname(
                require.resolve('mongodb-compass/src/app/fonts/FontAwesome.otf')
              )
            }
          }
        }
      }
    ]
  }`;
}

// Press ctrl+space for code completion
export default function transformer(file, api) {
  const j = api.jscodeshift;

  const kNotAnArg = Symbol('kNotAnArg');

  function findProp(obj, name, value = kNotAnArg) {
    return obj.properties.find(
      (prop) =>
        prop.key.name === name &&
        (value === kNotAnArg
          ? true
          : typeof value === 'function'
          ? value(prop)
          : prop.value.value === value)
    );
  }

  let localIdentName = '';
  let hasEncounteredFirstLessLoader = false;

  const AST = j(file.source);

  // AST.find(j.Property).forEach((path) => {
  //   if (path.node.key.name === 'localIdentName') {
  //     localIdentName = path.node.value;
  //   }
  // });

  AST.find(j.ObjectExpression).forEach((path) => {
    const isCSSLoader = !!findProp(path.node, 'loader', 'css-loader');
    if (isCSSLoader) {
      const options = path.node.properties.find(
        (prop) => prop.key.name === 'options'
      );
      if (options) {
        options.value.properties.unshift(
          j.property('init', j.identifier('importLoaders'), j.literal(1))
        );
      }
    }
    // if (isLessLoader) {
    //   if (hasEncounteredFirstLessLoader) {
    //     path.replace();
    //   } else {
    //     const lessLoader = createLessLoaderTemplate(j, localIdentName);
    //     path.replace(lessLoader);
    //     hasEncounteredFirstLessLoader = true;
    //   }
    // }
  });

  return AST.toSource({ quote: 'single' });
}
