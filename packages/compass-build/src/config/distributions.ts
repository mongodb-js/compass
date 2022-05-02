export type DistributionConfig = {
  productName: string;
  msiUpgradeCode: string;
};

export const distributions: Record<string, DistributionConfig> = {
  compass: {
    productName: 'MongoDB Compass',
    msiUpgradeCode: '0152273D-2F9F-4913-B67F-0FCD3557FFD1',
  },
  'compass-readonly': {
    productName: 'MongoDB Compass Readonly',
    msiUpgradeCode: '2176EC1D-EF71-49D4-B3B4-9E15B289D79A',
  },
  'compass-isolated': {
    productName: 'MongoDB Compass Isolated Edition',
    msiUpgradeCode: '516F2BE1-4417-4F31-BAA1-364A59404775',
  },
};

export function getDistributionConfig(
  distribution: string
): DistributionConfig {
  const distributionConfig = distributions[distribution];

  if (!distributionConfig) {
    throw new Error(`Unknown distribution ${distribution}`);
  }
  return distributionConfig;
}
