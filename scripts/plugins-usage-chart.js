const { promises: fs } = require('fs');
const glob = require('glob');
const j = require('jscodeshift');
const pkgUp = require('pkg-up');

class PluginInterface {
  roles = new Set();
  components = new Set();
  stores = new Set();
  get size() {
    return this.roles.size + this.components.size + this.stores.size;
  }
}

class Plugin {
  constructor(name) {
    this.name = name;
    this.registers = new PluginInterface();
    this.uses = new PluginInterface();
    this.dependencies = new Map();
  }

  calculateDependencies() {
    this.dependencies.clear();
    for (const [name, plugin] of Plugin.plugins) {
      // if (name === this.name) {
      //   continue;
      // }
      const interfaceDependencies = new PluginInterface();
      this.uses.roles.forEach((role) => {
        if (plugin.registers.roles.has(role)) {
          interfaceDependencies.roles.add(role);
        }
      });
      this.uses.components.forEach((component) => {
        if (plugin.registers.components.has(component)) {
          interfaceDependencies.components.add(component);
        }
      });
      this.uses.stores.forEach((store) => {
        if (plugin.registers.stores.has(store)) {
          interfaceDependencies.stores.add(store);
        }
      });
      if (interfaceDependencies.size > 0) {
        this.dependencies.set(name, interfaceDependencies);
      }
    }
    return this.dependencies;
  }

  static plugins = new Map();

  static get(name) {
    if (Plugin.plugins.has(name)) {
      return Plugin.plugins.get(name);
    } else {
      const plugin = new Plugin(name);
      Plugin.plugins.set(name, plugin);
      return plugin;
    }
  }
}

const CallExpressionToName = {
  'appRegistry.getStore(this.queryBarRole.storeName)': 'Query.Store',
  'localAppRegistry.registerStore(role.storeName, store)': [
    'Aggregations.CreateViewStore',
    'ExportToLanguage.Store',
    'Import.Store',
    'Export.Store',
    'Indexes.DropIndexStore',
    'Indexes.CreateIndexStore',
    'Query.History'
  ]
};

async function main() {
  const sourceFiles = glob
    .sync('packages/*/src/**/*.{js,ts,jsx,tsx}')
    .filter((path) => !/\.(test|spec)\.(js|ts|jsx|tsx)$/.test(path));

  for (const filePath of sourceFiles) {
    const packageJsonPath = await pkgUp({ cwd: filePath });
    const packageJson = require(packageJsonPath);

    if (!/^(@mongodb-js\/compass-|mongodb-compass$)/.test(packageJson.name)) {
      continue;
    }

    const plugin = Plugin.get(packageJson.name);
    const src = await fs.readFile(filePath, 'utf8');
    const ast = j(src);

    ast
      .find(j.CallExpression, {
        callee: {
          type: 'MemberExpression'
        }
      })
      .filter((nodePath) => {
        const { value: calleePropertyName } = nodePath
          .get('callee')
          .get('property')
          .get('name');

        return /^(get|register)(Component|Role|Store)(OrNull)?$/.test(
          calleePropertyName
        );
      })
      .forEach((nodePath) => {
        const { value: calleePropertyName } = nodePath
          .get('callee')
          .get('property')
          .get('name');

        const {
          value: [firstCallExprArg]
        } = nodePath.get('arguments');

        let name;

        switch (firstCallExprArg.type) {
          case 'Literal':
            name = firstCallExprArg.value;
            break;
          case 'Identifier': {
            const declarators = ast.findVariableDeclarators(
              firstCallExprArg.name
            );

            if (declarators.length > 0) {
              const init = declarators.get('init');
              if (init.get('type').value === 'Literal') {
                name = init.get('value').value;
                break;
              }
            }
          }
          default:
            const callExprStr = j(nodePath).toSource();
            if (CallExpressionToName[callExprStr]) {
              name = CallExpressionToName[callExprStr];
            } else {
              console.log(
                'Unable to resolve static name for the method call %s at %s',
                j(nodePath).toSource(),
                filePath
              );
              name = callExprStr;
            }
            break;
        }

        let set;

        switch (calleePropertyName) {
          case 'registerRole':
            set = plugin.registers.roles;
            break;
          case 'getRole':
          case 'getRoleOrNull':
            set = plugin.uses.roles.add(name);
            break;
          case 'registerComponent':
            set = plugin.registers.components.add(name);
            break;
          case 'getComponent':
          case 'getComponentOrNull':
            set = plugin.uses.components.add(name);
            break;
          case 'registerStore':
            set = plugin.registers.stores.add(name);
            break;
          case 'getStore':
          case 'getStoreOrNull':
            set = plugin.uses.stores.add(name);
            break;
        }

        if (Array.isArray(name)) {
          name.forEach((n) => set.add(n));
        } else {
          set.add(name);
        }
      });
  }

  console.log();

  function printDeps(name, deps) {
    if (deps.size > 0) {
      console.group(name === pluginName ? 'own' : name);
      if (deps.roles.size > 0) {
        console.group('roles');
        deps.roles.forEach((role) => console.log(role));
        console.groupEnd();
      }
      if (deps.components.size > 0) {
        console.group('components');
        deps.components.forEach((component) => console.log(component));
        console.groupEnd();
      }
      if (deps.stores.size > 0) {
        console.group('stores');
        deps.stores.forEach((store) => console.log(store));
        console.groupEnd();
      }
      console.groupEnd();
    } else {
      console.log('no dependencies');
    }
  }

  function printAllPluginDependencies(pluginName) {
    const dependencies = Plugin.get(pluginName).calculateDependencies();
    console.group(pluginName);
    if (dependencies.size) {
      for (const [name, deps] of dependencies) {
        printDeps(name, deps);
      }
    } else {
      console.log('no dependencies');
    }
    console.groupEnd();
    console.log();
  }

  const [pluginName = null] = process.argv.slice(2);

  if (pluginName) {
    printAllPluginDependencies(pluginName);
  } else {
    Plugin.plugins.forEach((_plugin, name) => {
      printAllPluginDependencies(name);
    });
  }
}

main();
