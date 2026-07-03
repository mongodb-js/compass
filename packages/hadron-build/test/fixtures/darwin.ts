import { resolvePath } from '../test-helpers';
import { type FixtureOpts, getBundleId, getProductName } from './utils';

export function getExpectedAssets({
  version,
  arch,
  distribution,
}: FixtureOpts) {
  return [
    {
      name: `mongodb-${distribution}-${version}-darwin-${arch}.dmg`,
      downloadCenter: true,
    },
    {
      name: `mongodb-${distribution}-${version}-darwin-${arch}.zip`,
    },
    {
      name: `mongodb-${distribution}-${version}-darwin-${arch}.zip.sig`,
    },
  ];
}

export function getExpectedPackagerOptions({
  version,
  arch,
  distribution,
  channel,
}: FixtureOpts) {
  const productName = getProductName(distribution, channel);
  const bundleId = getBundleId(distribution);

  return {
    dir: resolvePath('./'),
    out: resolvePath('dist'),
    overwrite: true,
    appCopyright: `${new Date().getFullYear()} MongoDB Inc`,
    buildVersion: version,
    appVersion: version,
    prune: false,
    ignore: /node_modules\/|\.cache\/|dist\/|test\/|\.user-data|\.deps\//,
    platform: 'darwin',
    arch,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    electronVersion: require('electron/package.json').version,
    icon: resolvePath(`app-icons/darwin/mongodb-compass-logo-${channel}.icns`),
    name: productName,
    appBundleId: `${bundleId}${channel !== 'stable' ? `.${channel}` : ''}`,
    appCategoryType: 'public.app-category.productivity',
    protocols: [
      { name: 'MongoDB Protocol', schemes: ['mongodb'] },
      { name: 'MongoDB+SRV Protocol', schemes: ['mongodb+srv'] },
    ],
  };
}

export function getExpectedInstallerOptions({
  version,
  arch,
  distribution,
  channel,
}: FixtureOpts) {
  const productName = getProductName(distribution, channel);
  const folderName = `${productName}-darwin-${arch}`;

  return {
    dmgPath: resolvePath(
      `dist/mongodb-${distribution}-${version}-darwin-${arch}.dmg`
    ),
    title: productName.substring(0, 25),
    overwrite: true,
    out: resolvePath('dist'),
    icon: resolvePath(`app-icons/darwin/mongodb-compass-logo-${channel}.icns`),
    identity_display: undefined,
    identity: undefined,
    appPath: resolvePath(`dist/${folderName}/${productName}.app`),
    background: resolvePath('app-icons/darwin/background.png'),
    contents: [
      { x: 322, y: 243, type: 'link', path: '/Applications' },
      {
        x: 93,
        y: 243,
        type: 'file',
        path: resolvePath(`dist/${folderName}/${productName}.app`),
      },
    ],
  };
}
