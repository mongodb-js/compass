import path from 'path';
import Target from './target';

export interface Attestation {
  downloadKey: string;
  uploadKey: string;
  localPath: string;
}

export const buildVariants = [
  'package-ubuntu',
  'package-windows',
  'package-rhel',
  'package-macos-x64',
  'package-macos-arm',
];

// Exported for tests
export function getBuildVersion(version?: string): string {
  const newVersion = version || process.env.HADRON_APP_VERSION;
  if (!newVersion) {
    throw new Error('Version not specified');
  }
  const channel = Target.getChannelFromVersion(newVersion);
  if (channel === 'dev' && process.env.DEV_VERSION_IDENTIFIER) {
    return process.env.DEV_VERSION_IDENTIFIER;
  }
  return newVersion;
}

const distroVariants = Target.supportedDistributions.flatMap((distro) => {
  return buildVariants.map((variant) => {
    return `${distro}-${variant}`;
  });
});

export function getPlatformSpecificAttestations(
  dir: string,
  version: string
): Attestation[] {
  return ['purls.txt', 'sbom-lite.json', 'sbom.json', 'first-party-deps.json'].flatMap(
    (file) => {
      return distroVariants.flatMap((variant) => ({
        downloadKey: path.join(variant, file),
        uploadKey: path.join(version, variant, file),
        localPath: path.join(dir, 'dist', variant, file),
      }));
    }
  );
}

export function getBuildSpecificAttestations(
  dir: string,
  version: string
): Attestation[] {
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
}

export function getBuildAttestations(dir: string, version?: string): Attestation[] {
  const buildVersion = getBuildVersion(version);
  return [
    ...getPlatformSpecificAttestations(dir, buildVersion),
    ...getBuildSpecificAttestations(dir, buildVersion),
  ];
}
