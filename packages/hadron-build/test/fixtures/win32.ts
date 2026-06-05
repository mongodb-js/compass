import { resolvePath } from '../test-helpers';
import { type FixtureOpts, getProductName, getNuggetVersion } from './utils';

export function getExpectedAssets({
  version,
  arch,
  distribution,
  channel,
}: FixtureOpts) {
  const productName = getProductName(distribution, channel);
  const slug = `mongodb-${distribution}${
    channel !== 'stable' ? `-${channel}` : ''
  }`;
  const packagerName = productName.replace(/ /g, '');
  const nuggetVersion = getNuggetVersion(version, channel);

  return [
    {
      name: `mongodb-${distribution}-${version}-win32-${arch}.exe`,
      downloadCenter: true,
    },
    {
      name: `mongodb-${distribution}-${version}-win32-${arch}.msi`,
      downloadCenter: true,
    },
    {
      name: `mongodb-${distribution}-${version}-win32-${arch}.zip`,
      downloadCenter: true,
    },
    {
      name: `mongodb-${distribution}-${version}-win32-${arch}.zip.sig`,
    },
    {
      name: `${slug}-RELEASES`,
    },
    {
      name: `${packagerName}-${nuggetVersion}-full.nupkg`,
    },
    {
      name: `${packagerName}-${nuggetVersion}-full.nupkg.sig`,
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
  const packagerName = productName.replace(/ /g, '');

  return {
    dir: resolvePath('./'),
    out: resolvePath('dist'),
    overwrite: true,
    appCopyright: `${new Date().getFullYear()} MongoDB Inc`,
    buildVersion: version,
    appVersion: version,
    prune: false,
    ignore: /node_modules\/|\.cache\/|dist\/|test\/|\.user-data|\.deps\//,
    platform: 'win32',
    arch,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    electronVersion: require('electron/package.json').version,
    name: packagerName,
    icon: resolvePath(`app-icons/win32/mongodb-compass-logo-${channel}.ico`),
    'version-string': {
      CompanyName: 'MongoDB Inc',
      FileDescription: 'The MongoDB GUI',
      ProductName: productName,
      InternalName: `mongodb-${distribution}`,
    },
  };
}

export function getExpectedInstallerOptions({
  version,
  arch,
  distribution,
  channel,
}: FixtureOpts) {
  const productName = getProductName(distribution, channel);
  const packagerName = productName.replace(/ /g, '');

  return {
    loadingGif: resolvePath(
      'app-icons/win32/mongodb-compass-installer-loading.gif'
    ),
    iconUrl: 'https://compass.mongodb.com/favicon.ico',
    appDirectory: resolvePath(`dist/${packagerName}-win32-${arch}`),
    outputDirectory: resolvePath('dist'),
    authors: 'MongoDB Inc',
    version,
    exe: `${packagerName}.exe`,
    setupExe: `mongodb-${distribution}-${version}-win32-${arch}.exe`,
    signWithParams: 'sign',
    title: productName,
    productName,
    description: 'The MongoDB GUI',
    name: packagerName,
    noMsi: true,
  };
}
