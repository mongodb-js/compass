const path = require('path');
const { promises: fs } = require('fs');
const { Arborist, Shrinkwrap } = require('@npmcli/arborist');
const pacote = require('pacote');
const { withProgress } = require('./monorepo/with-progress');

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
 */
async function main() {
  const rootPath = path.resolve(__dirname, '..');
  const workspaceName = process.argv.slice(2)[0];

  let arb, tree, workspaceNode, workspacePath;

  await withProgress('Loading dependencies tree', async () => {
    arb = new Arborist({ path: rootPath });
    // Using virtual here so that optional and system specific pacakges are also
    // included (they will be missing in `actual` if they are not on disk).
    tree = await arb.loadVirtual();
  });

  await withProgress(`Looking for ${workspaceName} workspace`, async () => {
    if (!tree.workspaces.has(workspaceName)) {
      const availableWorkspaces = Array.from(tree.workspaces.keys());

      throw new Error(
        `Workspace "${workspaceName}" doesn't exist. Available workspaces:\n\n${availableWorkspaces
          .map((name) => ` - ${name}`)
          .join('\n')}`
      );
    }

    workspacePath = tree.workspaces.get(workspaceName);
    workspaceNode = tree.children.get(workspaceName);
  });

  const packagesMeta = new Map();

  await withProgress(
    `Building dependency tree for ${workspaceName} workspace`,
    async () => {
      const packages = getAllChildrenForNode(workspaceNode);

      for (const packageNode of packages) {
        const metaPath = packageNode.path
          .replace(workspacePath, '')
          .replace(rootPath, '')
          .replace(/^(\/|\\)/, '');

        // In theory should never happen
        if (packagesMeta.has(metaPath)) {
          // TODO: print nice diff maybe
          // const pkgA = JSON.stringify(packagesMeta.get(metaPath), null, 2);
          const pkgB = JSON.stringify(packageNode, null, 2);
          throw new Error(
            `Conflicting package dependency: package ${packageNode.name} already exists on path ${metaPath}\n\n${pkgB}`
          );
        }

        let meta;

        if (packageNode.isLink) {
          meta = await resolvePackageMetaForLink(packageNode);
        } else {
          meta = Shrinkwrap.metaFromNode(packageNode);
        }

        packagesMeta.set(metaPath, meta);
      }
    }
  );

  await withProgress(
    `Writing package lock file to ${path.relative(
      process.cwd(),
      path.join(workspacePath, 'package-lock.json')
    )}`,
    async () => {
      // https://docs.npmjs.com/cli/v7/configuring-npm/package-lock-json#file-format
      const packageLock = {
        name: workspaceName,
        version: workspaceNode.version,
        lockfileVersion: 3,
        packages: Object.fromEntries(packagesMeta)
      };

      await fs.writeFile(
        path.join(workspacePath, 'package-lock.json'),
        JSON.stringify(packageLock, null, 2)
      );
    }
  );
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
        } at ${node.realpath}:\n\n${JSON.stringify(edge, null, 2)}`
      );
    } else if (pkg && !packages.has(pkg)) {
      packages.add(pkg);
      getAllChildrenForNode(pkg, packages);
    }
  }
  return packages;
}

function findPackageNodeRec(packageName, startNode) {
  const parent = startNode.parent || startNode.top || startNode.root || null;
  const node = startNode.isLink ? startNode.target : startNode;
  return startNode.children.has(packageName)
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
async function resolvePackageMetaForLink(link) {
  const manifest = await pacote.manifest(`${link.name}@${link.version}`, {
    // if env is undefined, defaults to https://registry.npmjs.org
    registry: process.env.npm_config_registry
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

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

main();
