var Module = require('module');
var path = require('path');
var semver = require('semver');

/**
 * Utility method to support inheritance without ES6.
 *
 * @param {Object} child - The subclass.
 * @param {Object} parent - The superclass.
 *
 * @returns {Object} The subclass.
 */
function __extends(child, parent) {
  for (var key in parent) { if (parent.hasOwnProperty(key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
};

/**
 * Common electron builtin modules.
 */
var COMMON_BUILTINS = [ 'callbacks-registry', 'clipboard', 'crash-reporter', 'screen', 'shell' ];

/**
 * Electron renderer builtin modules.
 */
var RENDERER_BUILTINS = [ 'ipc', 'remote' ];

/**
 * Dependency extensions.
 */
var EXTENSIONS = [ '.js', '.json', '.node' ];

/**
 * Extend the core semver Range prototype to match versions in the cache.
 */
var Range = (function() {
  __extends(Range, semver.Range);

  /**
   * The new Range constructor.
   */
  function Range() {
    Range.__super__.constructor.apply(this, arguments);
    this.matchedVersions = new Set();
    this.unmatchedVersions = new Set();
  }

  /**
   * Test the provided version for a match.
   *
   * @param {String} version - The version to match.
   *
   * @returns {Boolean} If the range matches.
   */
  Range.prototype.test = function(version) {
    if (this.matchedVersions.has(version)) {
      return true;
    }
    if (this.unmatchedVersions.has(version)) {
      return false;
    }
    var matches = Range.__super__.test.apply(this, arguments);
    if (matches) {
      this.matchedVersions.add(version);
    } else {
      this.unmatchedVersions.add(version);
    }
    return matches;
  };
  return Range;
})();

var nativeModules = process.binding('natives');

/**
 * The core module cache object.
 */
var cache = {
  builtins: {},
  dependencies: {},
  extensions: {},
  folders: {},
  ranges: {},
  registered: false,
  resourcePath: null,
  resourcePathWithTrailingSlash: null
};

if (process.platform === 'win32') {

  /**
   * Check if the path is an absolute path.
   *
   * @param {String} pathToCheck - The path to check.
   *
   * @returns {Boolean} If the path is absolute.
   */
  function isAbsolute(pathToCheck) {
    return pathToCheck && (pathToCheck[1] === ':' || (pathToCheck[0] === '\\' && pathToCheck[1] === '\\'));
  };
} else {

  /**
   * Check if the path is an absolute path.
   *
   * @param {String} pathToCheck - The path to check.
   *
   * @returns {Boolean} If the path is absolute.
   */
  function isAbsolute(pathToCheck) {
    return pathToCheck && pathToCheck[0] === '/';
  };
}

/**
 * Check if the path is a core path.
 *
 * @param {String} pathToCheck - The path to check.
 *
 * @returns {Boolean} If the path is a core path.
 */
function isCorePath(pathToCheck) {
  return pathToCheck.startsWith(cache.resourcePathWithTrailingSlash);
};

/**
 * Load all the dependencies of the application recursively.
 *
 * @param {String} modulePath - The module path.
 * @param {String} rootPath - The root path.
 * @param {String} rootMetadata - The root package.json.
 * @param {String} moduleCache - The module cache to add to.
 */
function loadDependencies(modulePath, rootPath, rootMetadata, moduleCache) {
  var fs = require('fs-plus');
  var modules = fs.listSync(path.join(modulePath, 'node_modules'));
  for (childPath in modules) {
    if (path.basename(childPath) === '.bin') {
      continue;
    }
    if (rootPath === modulePath && hasPackageDependency(rootMetadata, path.basename(childPath))) {
      continue;
    }
    var childMetadataPath = path.join(childPath, 'package.json');
    if (!fs.isFileSync(childMetadataPath)) {
      continue;
    }
    var childMetadata = JSON.parse(fs.readFileSync(childMetadataPath));
    if (childMetadata != null ? childMetadata.version : null) {
      var mainPath;
      try {
        mainPath = require.resolve(childPath);
      } catch (error) {
        mainPath = null;
      }
      if (mainPath) {
        moduleCache.dependencies.push({
          name: childMetadata.name,
          version: childMetadata.version,
          path: path.relative(rootPath, mainPath)
        });
      }
      loadDependencies(childPath, rootPath, rootMetadata, moduleCache);
    }
  }
};

/**
 * Recursively load appropriate files in compatible folders.
 *
 * @param {String} modulePath - The module path.
 * @param {String} rootPath - The root path.
 * @param {String} rootMetadata - The root package.json.
 * @param {String} moduleCache - The module cache to add to.
 */
function loadFolderCompatibility(modulePath, rootPath, rootMetadata, moduleCache) {
  var fs = require('fs-plus');
  var metadataPath = path.join(modulePath, 'package.json');
  if (!fs.isFileSync(metadataPath)) {
    return;
  }
  var metadata = JSON.parse(fs.readFileSync(metadataPath));
  var deps = (metadata != null) ? metadata.dependencies : {};
  var dependencies = (deps != null) ? deps : {};
  for (name in dependencies) {
    version = dependencies[name];
    try {
      new Range(version);
    } catch (error) {
      delete dependencies[name];
    }
  }
  function onDirectory(childPath) {
    return path.basename(childPath) !== 'node_modules';
  };
  var paths = {};
  function onFile(childPath) {
    var extname = path.extname(childPath);
    if (extname && EXTENSIONS.indexOf(extname) >= 0) {
      relativePath = path.relative(rootPath, path.dirname(childPath));
      return paths[relativePath] = true;
    }
  };
  fs.traverseTreeSync(modulePath, onFile, onDirectory);
  paths = Object.keys(paths);
  if (paths.length > 0 && Object.keys(dependencies).length > 0) {
    moduleCache.folders.push({
      paths: paths,
      dependencies: dependencies
    });
  }
  var modules = fs.listSync(path.join(modulePath, 'node_modules'));
  for (childPath in modules) {
    if (path.basename(childPath) === '.bin') {
      continue;
    }
    if (rootPath === modulePath && hasPackageDependency(rootMetadata, path.basename(childPath))) {
      continue;
    }
    loadFolderCompatibility(childPath, rootPath, rootMetadata, moduleCache);
  }
};

/**
 * Load extensions, excluding tests.
 *
 * @param {String} modulePath - The module path.
 * @param {String} rootPath - The root path.
 * @param {String} rootMetadata - The root package.json.
 * @param {String} moduleCache - The module cache to add to.
 */
function loadExtensions(modulePath, rootPath, rootMetadata, moduleCache) {
  var fs = require('fs-plus');
  var nodeModulesPath = path.join(rootPath, 'node_modules');
  function onFile(filePath) {
    filePath = path.relative(rootPath, filePath);
    var segments = filePath.split(path.sep);
    if (segments.indexOf('test') >= 0) {
      return;
    }
    if (segments.indexOf('tests') >= 0) {
      return;
    }
    if (segments.indexOf('spec') >= 0) {
      return;
    }
    if (segments.indexOf('specs') >= 0) {
      return;
    }
    var first = segments[0];
    if (segments.length > 1 && !(first === 'lib' || first === 'node_modules' || first === 'src' || first === 'static' || first === 'vendor')) {
      return;
    }
    var extension = path.extname(filePath);
    var base = moduleCache.extensions[extension];
    if (EXTENSIONS.indexOf(extension) >= 0) {
      if (base == null) {
        moduleCache.extensions[extension] = [];
      }
      return moduleCache.extensions[extension].push(filePath);
    }
  };
  function onDirectory(childPath) {
    if (rootMetadata.name === 'nylas') {
      var parentPath = path.dirname(childPath);
      if (parentPath === nodeModulesPath) {
        var packageName = path.basename(childPath);
        if (hasPackageDependency(rootMetadata, packageName)) {
          return false;
        }
      }
    }
    return true;
  };
  fs.traverseTreeSync(rootPath, onFile, onDirectory);
};

/**
 * Determine if the provided metadata has the named package dependency.
 *
 * @param {Object} metadata - The metadata to check.
 * @param {String} name - The package name.
 *
 * @return {Boolean} If the metadata has the package dependency.
 */
function hasPackageDependency(metadata, name) {
  var packageDeps = metadata.packageDependencies;
  return (packageDeps != null) && packageDeps.hasOwnProperty(name);
};

/**
 * Check if the provided version satifies the range.
 *
 * @param {String} version - The version.
 * @param {String} rawRange - The range.
 *
 * @returns {Boolean} If the version satifies the range.
 */
function satisfies(version, rawRange) {
  var parsedRange;
  if (!(parsedRange = cache.ranges[rawRange])) {
    parsedRange = new Range(rawRange);
    cache.ranges[rawRange] = parsedRange;
  }
  return parsedRange.test(version);
};

/**
 * Resolve the file path.
 *
 * @param {String} relativePath - The relative file path.
 * @param {String} parentModule - The parent module location.
 *
 * @returns {String} The resolved file path.
 */
function resolveFilePath(relativePath, parentModule) {
  if (!relativePath) {
    return;
  }
  if (!(parentModule != null && parentModule.filename)) {
    return;
  }
  if (!(relativePath[0] === '.' || isAbsolute(relativePath))) {
    return;
  }
  var resolvedPath = path.resolve(path.dirname(parentModule.filename), relativePath);
  if (!isCorePath(resolvedPath)) {
    return;
  }
  var extension = path.extname(resolvedPath);
  if (extension) {
    var ext = cache.extensions[extension];
    if (ext != null && ext.has(resolvedPath)) {
      return resolvedPath;
    }
  } else {
    for (extension in cache.extensions) {
      var paths = cache.extensions[extension];
      var resolvedPathWithExtension = resolvedPath + extension;
      if (paths.has(resolvedPathWithExtension)) {
        return resolvedPathWithExtension;
      }
    }
  }
};

/**
 * Resolve the module path.
 *
 * @param {String} relativePath - The relative file path.
 * @param {String} parentModule - The parent module location.
 *
 * @returns {String} The resolved module path.
 */
function resolveModulePath(relativePath, parentModule) {
  if (!relativePath) {
    return;
  }
  if (!(parentModule != null ? parentModule.filename : void 0)) {
    return;
  }
  if (nativeModules.hasOwnProperty(relativePath)) {
    return;
  }
  if (relativePath[0] === '.') {
    return;
  }
  if (isAbsolute(relativePath)) {
    return;
  }
  var folderPath = path.dirname(parentModule.filename);
  var folder = cache.folders[folderPath];
  var range = (folder != null) ? folder[relativePath] : null;
  if (range == null) {
    var builtinPath = cache.builtins[relativePath];
    if (builtinPath) {
      return builtinPath;
    } else {
      return;
    }
  }
  var candidates = cache.dependencies[relativePath];
  if (candidates == null) {
    return;
  }
  for (version in candidates) {
    var resolvedPath = candidates[version];
    if (Module._cache.hasOwnProperty(resolvedPath) || isCorePath(resolvedPath)) {
      if (satisfies(version, range)) {
        return resolvedPath;
      }
    }
  }
};

/**
 * Register core electron modules in the cache.
 */
function registerBuiltins() {
  var electronRoot = path.join(process.resourcesPath, 'atom.asar');
  var commonRoot = path.join(electronRoot, 'common', 'api', 'lib');
  for (builtin in COMMON_BUILTINS) {
    cache.builtins[builtin] = path.join(commonRoot, "" + builtin + ".js");
  }
  var rendererRoot = path.join(electronRoot, 'renderer', 'api');
  var results = [];
  for (builtin in RENDERER_BUILTINS) {
    results.push(cache.builtins[builtin] = path.join(rendererRoot, "" + builtin + ".js"));
  }
  return results;
};

/**
 * Create the module cache from the module path.
 *
 * @param {String} modulePath - The root module path.
 */
function create(modulePath) {
  var fs = require('fs-plus');
  var modulePath = fs.realpathSync(modulePath);
  var metadataPath = path.join(modulePath, 'package.json');
  var metadata = JSON.parse(fs.readFileSync(metadataPath));
  moduleCache = { version: 1, dependencies: [], extensions: {}, folders: [] };
  loadDependencies(modulePath, modulePath, metadata, moduleCache);
  loadFolderCompatibility(modulePath, modulePath, metadata, moduleCache);
  loadExtensions(modulePath, modulePath, metadata, moduleCache);
  metadata._compassModuleCache = moduleCache;
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
};

/**
 * Register the resource path with the cache. All requires under the path will
 * subsequently be attempted to be pulled from the cache.
 *
 * @param {String} resourcePath - The root resource path.
 */
function register(resourcePath) {
  if (cache.registered) {
    return;
  }
  var originalResolveFilename = Module._resolveFilename;
  Module._resolveFilename = function(relativePath, parentModule) {
    var resolvedPath = resolveModulePath(relativePath, parentModule);
    if (resolvedPath == null) {
      resolvedPath = resolveFilePath(relativePath, parentModule);
    }
    return resolvedPath != null ? resolvedPath : originalResolveFilename(relativePath, parentModule);
  };
  cache.registered = true;
  cache.resourcePath = resourcePath;
  cache.resourcePathWithTrailingSlash = resourcePath + path.sep;
  registerBuiltins();
};

/**
 * Adds the directory to the cache.
 *
 * @param {String} directoryPath - The directory to add.
 * @param {Object} metadata - The optional package.json for the directory.
 */
function add(directoryPath) {
  var metadata = require(directoryPath + path.sep + "package.json");
  var cacheToAdd = metadata._compassModuleCache;

  if (cacheToAdd == null) {
    return;
  }

  var dependencies = cacheToAdd.dependencies;
  var deps = (dependencies != null) ? dependencies : [];
  for (dependency in deps) {
    if (!cache.dependencies[dependency.name]) {
      cache.dependencies[dependency.name] = {};
    }
    if (!cache.dependencies[dependency.name][dependency.version]) {
      cache.dependencies[dependency.name][dependency.version] = directoryPath + path.sep + dependency.path;
    }
  }

  var cacheFolders = cacheToAdd.folders;
  var folders = (cacheFolders != null) ? cacheFolders : [];
  for (folder in folders) {
    for (folderPath in folder.paths) {
      if (folderPath) {
        cache.folders[directoryPath + path.sep + folderPath] = entry.dependencies;
      } else {
        cache.folders[directoryPath] = folder.dependencies;
      }
    }
  }

  for (extension in cacheToAdd.extensions) {
    if (cache.extensions[extension] == null) {
      cache.extensions[extension] = new Set();
    }
    for (filePath in cacheToAdd.extensions[extension]) {
      cache.extensions[extension].add(directoryPath + path.sep + filePath);
    }
  }
};

module.exports.cache = cache;
module.exports.create = create;
module.exports.register = register;
module.exports.add = add;
