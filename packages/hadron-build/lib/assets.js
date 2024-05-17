const Target = require('../lib/target');

const distributionLabel = {
  'compass-readonly': 'Readonly Edition',
  'compass-isolated': 'Isolated Edition'
};

const channelLabel = {
  stable: 'Stable',
  beta: 'Beta',
  dev: 'Dev'
};

function versionId(version, distribution = '') {
  return [version, distribution.replace(/compass-?/, '')]
    .filter(Boolean)
    .join('-');
}

function readableVersionName(version, channel, distribution) {
  const desc = [distributionLabel[distribution], channelLabel[channel]]
    .filter(Boolean)
    .join(' ');
  return `${version} ${desc ? `(${desc})` : ''}`.trim();
}

function readablePlatformName(arch, platform, fileName = '') {
  let name = null;

  switch (`${platform}-${arch}`) {
    case 'darwin-x64':
      name = 'macOS 64-bit (10.14+)';
      break;
    case 'darwin-arm64':
      name = 'macOS arm64 (M1) (11.0+)';
      break;
    case 'win32-x64':
      name = 'Windows 64-bit (10+)';
      break;
    case 'linux-x64':
      name = fileName.endsWith('.rpm')
        ? 'RedHat 64-bit (8+)'
        : 'Ubuntu 64-bit (16.04+)';
      break;
    default:
      throw new Error(
        `Unexpected asset for the download center: ${platform} ${arch} ${fileName}`
      );
  }

  if (fileName.endsWith('.zip')) {
    name += ' (Zip)';
  }

  if (fileName.endsWith('.msi')) {
    name += ' (MSI)';
  }

  return name;
}

function getDownloadLink(basepath, asset) {
  if (!basepath) {
    return asset.name;
  }
  return `${basepath}/${asset.name}`;
}

function generateVersionsForAssets(assets, version, downloadUrl) {
  const channel = Target.getChannelFromVersion(version);
  return Target.supportedDistributions.map((distribution) => {
    return {
      _id: versionId(version, distribution),
      version: readableVersionName(version, channel, distribution),
      platform: assets
        .filter((asset) => {
          return asset.config.distribution === distribution;
        })
        // eslint-disable-next-line no-shadow
        .flatMap(({ assets, config }) => {
          return assets
            .filter(({ downloadCenter }) => {
              return downloadCenter;
            })
            .map((asset) => {
              return {
                arch: config.arch,
                os: config.platform,
                name: readablePlatformName(
                  config.arch,
                  config.platform,
                  asset.name
                ),
                download_link: getDownloadLink(downloadUrl, asset),
              };
            });
        })
    };
  });
}

module.exports = {
  versionId,
  readableVersionName,
  readablePlatformName,
  generateVersionsForAssets,
}