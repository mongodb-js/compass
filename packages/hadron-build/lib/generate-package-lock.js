const path = require('path');
const { inspect } = require('util');
const { Arborist, Shrinkwrap } = require('@npmcli/arborist');
const pacote = require('pacote');

const debug = require('debug')('hadron-build:generate-package-lock');

/**
 * This script produces a fully "detached" package-lock file for a specific
 * workspace from a root dependencies tree in an npm workspace. This might be
 * helpful when you want a workspace to be aware of its exact dependencies
 * versions outside of your monorepo setup.
 *
 * For the description of Node, Link and Edge data structures refer to the
 * arborist docs[0].
 *
 * [0] - https://github.com/npm/arborist#data-structures
 *
 * @param {string} workspaceName
 * @param {string} npmRegistry
 * @param {string} monorepoRootPath
 * @returns {Object}
 */
async function generatePackageLock(
  workspaceName,
  npmRegistry = process.env.npm_config_registry,
  monorepoRootPath = path.resolve(__dirname, '..', '..', '..')
) {
  let arb;
  let tree;
  let workspaceNode;

  debug('Loading dependencies tree');
  arb = new Arborist({ path: monorepoRootPath });
  // Using virtual here so that optional and system specific pacakges are also
  // included (they will be missing in `actual` if they are not on disk).
  tree = await arb.loadVirtual();

  debug(`Looking for ${workspaceName} workspace`);

  if (!tree.workspaces.has(workspaceName)) {
    const availableWorkspaces = Array.from(tree.workspaces.keys());

    throw new Error(
      `Workspace "${workspaceName}" doesn't exist. Available workspaces:\n\n${availableWorkspaces
        .map((name) => ` - ${name}`)
        .join('\n')}`
    );
  }

  workspaceNode = tree.children.get(workspaceName);

  const packagesMeta = new Map();

  debug(`Building dependency tree for ${workspaceName} workspace`);

  debug('Collecting all packages for node');

  const packages = getAllChildrenForNode(workspaceNode);

  debug(`Found ${packages.size} packages`);

  debug('Normalizing packages tree paths');

  for (const packageNode of packages) {
    const metaPath = path.join(
      parentPackageToPath(getNodeParent(packageNode), workspaceName),
      'node_modules',
      packageNode.packageName
    );

    /**
     * We can end up here if workspace that we are trying to build a
     * package-lock for has a direct dependency with the version that was not
     * deduped for the workspace, but was deduped and hoisted to root of the
     * monorepo for other packages (e.g., if workspace-a has a dependency on
     * pkg-a@1 and workspace-b with workspace-c both have dependency on pkg-a@2
     * we will run into a collision here trying to buid a package-lock for
     * workspace-a)
     *
     * To mitigate that, if we run into the issue like that, we will un-hoist
     * already existing dependency and remove it from packagesMeta map
     */
    if (packagesMeta.has(metaPath)) {
      debug(
        `Unhoisting existing package ${packageNode.packageName} from ${metaPath}`
      );
      unhoistDependencyAtPath(packagesMeta, metaPath, workspaceName);
    }

    packagesMeta.set(metaPath, packageNode);
  }

  debug('Generating package-lock metadata for package nodes');

  for (const [packageName, packageNode] of packagesMeta) {
    let meta;

    if (packageNode.isLink) {
      meta = await resolvePackageMetaForLink(packageNode, npmRegistry);
    } else {
      meta = Shrinkwrap.metaFromNode(packageNode);
    }

    packagesMeta.set(packageName, meta);
  }

  debug('Generating package-lock v3');

  // https://docs.npmjs.com/cli/v7/configuring-npm/package-lock-json#file-format
  const packageLock = {
    name: workspaceName,
    version: workspaceNode.version,
    lockfileVersion: 3,
    packages: Object.fromEntries(packagesMeta)
  };

  return packageLock;
}

const maybeMissingType = ['optional', 'peer', 'peerOptional'];

function getAllChildrenForNode(nodeOrLink, packages = new Set()) {
  const node = nodeOrLink.isLink ? nodeOrLink.target : nodeOrLink;
  for (const edge of node.edgesOut.values()) {
    const pkg = findPackageNodeRec(edge.name, nodeOrLink);
    if (!maybeMissingType.includes(edge.type) && !pkg) {
      throw new Error(
        `Failed to resolve edge ${edge.name} from package ${
          node.packageName
        } at ${node.realpath}:\n\n${inspect(edge)}`
      );
    }
    if (pkg && !packages.has(pkg)) {
      packages.add(pkg);
      getAllChildrenForNode(pkg, packages);
    }
  }
  return packages;
}

function getNodeParent(node) {
  return (
    node.parent ||
    (node.isWorkspace ? node.root : node.top) ||
    node.root ||
    null
  );
}

function parentPackageToPath(parentNode, targetWorkspacePackageName) {
  if (parentNode.packageName === targetWorkspacePackageName) {
    return '';
  } else if (parentNode.top.isWorkspace) {
    return parentNode.location.replace(
      parentNode.top.location,
      path.join('node_modules', parentNode.top.packageName)
    );
  }
  return parentNode.location;
}

function unhoistDependencyAtPath(
  packagesMap,
  packagePath,
  packageLockRootPackageName
) {
  const packageNode = packagesMap.get(packagePath);
  for (const edge of packageNode.edgesIn) {
    const newPath = path.join(
      parentPackageToPath(edge.from, packageLockRootPackageName),
      'node_modules',
      packageNode.packageName
    );
    packagesMap.set(newPath, packageNode);
  }
  packagesMap.delete(packagePath);
  return packagesMap;
}

function findPackageNodeRec(packageName, startNode) {
  const parent = getNodeParent(startNode);
  const node = startNode.isLink ? startNode.target : startNode;

  return node.children.has(packageName)
    ? node.children.get(packageName)
    : parent && parent !== startNode
      ? findPackageNodeRec(packageName, parent)
      : null;
}

const manifestKeys = [
  'version',
  'bin',
  'license',
  'engines',
  'dependencies',
  'optionalDependencies',
  '_resolved',
  '_integrity'
];

const nodePackageKeys = ['inBundle', 'hasShrinkwrap', 'hasInstallScript'];

/**
 * Create a shrinkwrap package meta from registry metadata following the
 * description in npm docs[0] and internal arborist implementation[1] (we can't
 * use `Shrinkwrap.metaFromNode` directly for LINKs as their metadata will
 * produce an incorrect shrinkwrap meta)
 *
 * [0] - https://docs.npmjs.com/cli/v7/configuring-npm/package-lock-json#packages
 * [1] - https://github.com/npm/arborist/blob/75c785f64bc27f326b645854be0b2607e219f09b/lib/shrinkwrap.js#L107-L146
 */
async function resolvePackageMetaForLink(link, npmRegistry) {
  debug(
    `Fetching metadata for ${
      link.isWorkspace ? 'workspace' : 'linked'
    } package ${link.name}@${link.version}`
  );

  const manifest = await pacote.manifest(`${link.name}@${link.version}`, {
    // if env is undefined, defaults to https://registry.npmjs.org
    registry: npmRegistry
  });

  const meta = {
    // XXX: We are not providing `dev`, `optional`, `devOptional` (see npm docs
    // for description): those are not set on the LINKs and their children
    // returned by arborist and there is no easy way to get that info without a
    // deeper tree inspection. Good news are this info is not really required
    // for our purposes, so we can skip it.
  };

  manifestKeys.forEach((key) => {
    if (manifest[key]) {
      meta[key.replace('_', '')] = manifest[key];
    }
  });

  nodePackageKeys.forEach((key) => {
    if (link.package[key]) {
      meta[key] = link.package[key];
    }
  });

  return meta;
}

module.exports = generatePackageLock;
