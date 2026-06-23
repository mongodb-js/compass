import { resolvePath } from '../test-helpers';
import { type FixtureOpts, getProductName, getSlug } from './utils';

export function getExpectedAssets({
  version,
  arch,
  distribution,
  channel,
}: FixtureOpts) {
  const debArch = arch === 'x64' ? 'amd64' : 'i386';
  const rpmArch = arch === 'x64' ? 'x86_64' : 'i386';
  const slug = getSlug(distribution, channel);

  return [
    {
      name: `${slug}_${version}_${debArch}.deb`,
      downloadCenter: true,
    },
    {
      name: `${slug}_${version}_${debArch}.deb.sig`,
    },
    {
      name: `${slug}-${version}.${rpmArch}.rpm`,
      downloadCenter: true,
    },
    {
      name: `${slug}-${version}-linux-${arch}.tar.gz`,
    },
    {
      name: `${slug}-${version}-linux-${arch}.tar.gz.sig`,
    },
    {
      name: `${slug}-${version}-rhel-${arch}.tar.gz`,
    },
    {
      name: `${slug}-${version}-rhel-${arch}.tar.gz.sig`,
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

  return {
    dir: resolvePath('./'),
    out: resolvePath('dist'),
    overwrite: true,
    appCopyright: `${new Date().getFullYear()} MongoDB Inc`,
    buildVersion: version,
    appVersion: version,
    prune: false,
    ignore: /node_modules\/|\.cache\/|dist\/|test\/|\.user-data|\.deps\//,
    platform: 'linux',
    arch,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    electronVersion: require('electron/package.json').version,
    name: productName,
  };
}

export function getExpectedInstallerOptions({
  version,
  arch,
  distribution,
  channel,
}: FixtureOpts) {
  const productName = getProductName(distribution, channel);
  const slug = getSlug(distribution, channel);
  const debArch = arch === 'x64' ? 'amd64' : 'i386';
  const rpmArch = arch === 'x64' ? 'x86_64' : 'i386';
  const appPath = resolvePath(`dist/${productName}-linux-${arch}`);

  return {
    deb: {
      src: appPath,
      dest: resolvePath('dist'),
      arch: debArch,
      icon: resolvePath(`app-icons/linux/mongodb-compass-logo-${channel}.png`),
      name: slug,
      version,
      bin: productName,
      section: 'Databases',
      depends: ['libsecret-1-0', 'gnome-keyring'],
      mimeType: ['x-scheme-handler/mongodb', 'x-scheme-handler/mongodb+srv'],
    },
    rpm: {
      src: appPath,
      dest: resolvePath('dist'),
      arch: rpmArch,
      icon: resolvePath(`app-icons/linux/mongodb-compass-logo-${channel}.png`),
      name: slug,
      version: channel === 'stable' ? version : version.split('-')[0],
      revision: channel === 'stable' ? '1' : version.split('-')[1],
      bin: productName,
      requires: ['gnome-keyring', 'libsecret'],
      categories: [
        'Office',
        'Database',
        'Building',
        'Debugger',
        'IDE',
        'GUIDesigner',
        'Profiling',
      ],
      license: 'SSPL',
      mimeType: ['x-scheme-handler/mongodb', 'x-scheme-handler/mongodb+srv'],
    },
  };
}
