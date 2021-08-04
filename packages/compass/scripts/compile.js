/* eslint-disable no-console */
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const CompileCache = require('hadron-compile-cache');
const StyleManager = require('hadron-style-manager');
const _ = require('lodash');
const pkgUp = require('pkg-up');
const async = require('async');
const util = require('util');

const COMPILE_CACHE = '.compiled-sources';
const COMPILE_CACHE_MAPPINGS = '_compileCacheMappings';
const CACHE_PATTERN = '**/*.{jade,jsx,md}';

/**
 * Clean out the existing development compile cache.
 *
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
const cleanCompileCache = util.promisify((config, done) => {
  console.info('cleaning out development compile cache');
  fs.remove(path.resolve(config.rootDir, COMPILE_CACHE), function() {
    done();
  });
});

/**
 * Create a precompiled cache of .jade and .jsx sources.
 *
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
const createCompileCache = util.promisify((config, done) => {
  console.info('creating compile cache');
  var appDir = config.rootDir;
  CompileCache.setHomeDirectory(appDir);
  glob(`src/${CACHE_PATTERN}`, function(error, files) {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    _.each(files, function(file) {
      var compiler = CompileCache.COMPILERS[path.extname(file)];
      CompileCache.compileFileAtPath(compiler, file);
    });
    // Write the compile cache mappings to the package.json.
    const PACKAGE_JSON_DEST = path.join(config.rootDir, 'package.json');
    let metadata = require(PACKAGE_JSON_DEST);
    metadata[COMPILE_CACHE_MAPPINGS] = CompileCache.digestMappings;
    fs.writeFile(path.join(appDir, 'package.json'), JSON.stringify(metadata, null, 2), done);
  });
});

/**
 * Use the style manager to build the css and inject into the index.html
 * and help.html.
 */
const createPackagedStyles = util.promisify((config, done) => {
  const rootDir = config.rootDir;
  const appDir = path.join(rootDir, 'src', 'app');

  // eslint-disable-next-line no-sync
  fs.copyFileSync(
    path.join(appDir, 'index.html.template'),
    path.join(appDir, 'index.html')
  );

  const metadata = config.pkg;
  const dist = metadata.config.hadron.distributions[config.distribution];

  console.info(`Creating styles for distribution: ${config.distribution}`);

  const tasks = [];
  const manager = new StyleManager(path.join(appDir, '.compiled-less'), appDir);

  const styles = dist.styles;
  for (let file of styles) {
    tasks.push((taskDone) => {
      manager.build(path.join(appDir, `${file}.html`), path.join(appDir, `${file}.less`), taskDone);
    });
  }

  const plugins = dist.plugins;
  for (let dir of plugins) {
    let pluginPath;
    try {
      pluginPath = path.dirname(
        pkgUp.sync({ cwd: require.resolve(dir, { paths: [rootDir] }) })
      );
    } catch (e) {
      pluginPath = path.join(rootDir, dir);
    }
    const fullDir = path.join(pluginPath, 'styles', 'index.less');
    tasks.push((taskDone) => {
      manager.build(path.join(appDir, `${styles[0]}.html`), fullDir, taskDone);
    });
  }

  async.series(tasks, done);
});

async function buildStylesAndTemplates(packageRoot) {
  // eslint-disable-next-line no-sync
  const pkg = fs.readJsonSync(path.join(packageRoot, 'package.json'));
  const distribution = process.env.HADRON_DISTRIBUTION || pkg.config.hadron.distributions.default;
  const config = {
    rootDir: packageRoot,
    pkg,
    distribution
  };

  await cleanCompileCache(config);
  await createCompileCache(config);
  await createPackagedStyles(config);
}

buildStylesAndTemplates(path.resolve(__dirname, '..'));
