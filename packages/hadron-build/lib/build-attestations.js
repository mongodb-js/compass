const path = require('path');
const Target = require('./target');

const buildVariants = [
  'package-ubuntu',
  'package-windows',
  'package-rhel',
  'package-macos-x64',
  'package-macos-arm',
];

const distroVariants = Target.supportedDistributions.map(distro => {
  return buildVariants.map(variant => {
    return `${distro}-${variant}`;
  });
}).flat();

const getPlatformSpecificAttestations = (dir) => {
  // {compass-readonly}-{package-ubuntu}/{purls.txt}
  return [
    'purls.txt',
    'sbom-lite.json',
    'sbom.json',
    'first-party-deps.json',
  ].map(file => {
    return distroVariants.map(variant => ({
      name: file,
      path: path.join(dir, 'dist', variant, file),
    })).flat();
  }).flat();
}

const getBuildSpecificAttestations = (dir) => {
  return [
    'dependencies.json',
    'snyk-test-result.json',
    'vulnerability-report.md',
    'static-analysis-report.tgz',
  ].map(file => ({
    name: file,
    path: path.join(dir, 'dist', file),
  }));
}

const getBuildAttestations = (dir) => {
  return [
    ...getPlatformSpecificAttestations(dir),
    ...getBuildSpecificAttestations(dir),
  ]
};

module.exports = {
  getBuildAttestations,
};