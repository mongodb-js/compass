import type { SemVer } from 'semver';
import { getDistributionConfig } from './distributions';
import { getVersionInfo } from './get-version-info';
import type { PackageJson } from './read-package-json';
import { readPackageJson } from './read-package-json';

export type ProductConfig = {
  version: string;
  packageName: string;
  productName: string;
  description: string;
  channel: string;
  distribution: string;
  autoUpdateEndpoint: string;
  companyName: string;
  copyright: string;
  msiUpgradeCode: string;
  semver: SemVer;
  packageJson: PackageJson;
};

export async function readConfig(
  packagePath: string,
  options: {
    distribution: string;
  }
): Promise<ProductConfig> {
  const packageJson = await readPackageJson(packagePath);
  const versionInfo = getVersionInfo(packageJson.version);
  const distributionConfig = getDistributionConfig(options.distribution);

  return {
    version: packageJson.version,
    description: 'The MongoDB GUI',
    semver: versionInfo.semver,
    channel: versionInfo.channel,
    distribution: options.distribution,
    packageName: `mongodb-${options.distribution}`,
    productName: [
      distributionConfig.productName,
      versionInfo.channelSuffix,
    ].join(' '),
    msiUpgradeCode: distributionConfig.msiUpgradeCode,
    autoUpdateEndpoint: 'https://compass.mongodb.com',
    companyName: 'MongoDB Inc',
    copyright: `${new Date().getFullYear()} MongoDB Inc`,
    packageJson,
  };
}
