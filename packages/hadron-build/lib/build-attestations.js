const path = require('path');
const Target = require('./target');

const buildVariants = [
  'package-ubuntu',
  'package-windows',
  'package-rhel',
  'package-macos-x64',
  'package-macos-arm',
];

const getBuildVersion = (version) => {
  const newVersion = version || process.env.HADRON_APP_VERSION;
  if (!newVersion) {
    throw new Error('Version not specified');
  }
  const channel = Target.getChannelFromVersion(newVersion);
  if (channel === 'dev' && process.env.DEV_VERSION_IDENTIFIER) {
    return process.env.DEV_VERSION_IDENTIFIER;
  }
  return newVersion;
};

const distroVariants = Target.supportedDistributions
  .map((distro) => {
    return buildVariants.map((variant) => {
      return `${distro}-${variant}`;
    });
  })
  .flat();

const getPlatformSpecificAttestations = (dir, version) => {
  return ['purls.txt', 'sbom-lite.json', 'sbom.json', 'first-party-deps.json']
    .map((file) => {
      return distroVariants
        .map((variant) => ({
          downloadKey: path.join(variant, file),
          uploadKey: path.join(version, variant, file),
          localPath: path.join(dir, 'dist', variant, file),
        }))
        .flat();
    })
    .flat();
};

const getBuildSpecificAttestations = (dir, version) => {
  return [
    'dependencies.json',
    'snyk-test-result.json',
    'vulnerability-report.md',
    'static-analysis-report.tgz',
  ].map((file) => ({
    downloadKey: file,
    uploadKey: path.join(version, file),
    localPath: path.join(dir, 'dist', file),
  }));
};

const getBuildAttestations = (dir, version) => {
  const buildVersion = getBuildVersion(version);
  return [
    ...getPlatformSpecificAttestations(dir, buildVersion),
    ...getBuildSpecificAttestations(dir, buildVersion),
  ];
};

module.exports = {
  getBuildAttestations,
  // Exported for tests
  getBuildVersion,
  getBuildSpecificAttestations,
  getPlatformSpecificAttestations,
  buildVariants,
};
