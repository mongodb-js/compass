import type { CompassBrowser } from '../../compass-browser';
import { ATLAS_CLOUD_TEST_UTILS } from '../../test-runner-context';
import { doCloudFetch } from './utils';

type FeatureFlag = {
  phase: string;
  emergencyPhase?: string;
  allowList: string[];
  blockList: string[];
  rolloutPercentage: number;
};

export async function changeConfigServiceFeatureFlag(
  browser: CompassBrowser,
  featureFlagName: string,
  entityId: string,
  newStatus: 'enabled' | 'disabled'
) {
  const { featureFlags } = await doCloudFetch<{
    featureFlags: {
      id: string;
      name: string;
      data: FeatureFlag;
    }[];
  }>(browser, ATLAS_CLOUD_TEST_UTILS.featureFlags);
  const flagDescription = featureFlags.find((flag) => {
    return flag.name === featureFlagName;
  });
  if (!flagDescription) {
    throw new Error(`Can not find feature flag ${featureFlagName}`);
  }
  const currentPhase =
    flagDescription.data.emergencyPhase || flagDescription.data.phase;
  if (currentPhase !== 'PHASE_CONTROLLED') {
    throw new Error(
      `Can not override feature flag that is not in controlled phase (got ${flagDescription.data.phase})`
    );
  }
  const flagUpdate = {
    allowList: flagDescription.data.allowList,
    blockList: flagDescription.data.blockList,
  };
  if (newStatus === 'enabled') {
    flagUpdate.allowList.push(entityId);
    flagUpdate.blockList = flagUpdate.blockList.filter((id) => {
      return id !== entityId;
    });
  }
  if (newStatus === 'disabled') {
    flagUpdate.blockList.push(entityId);
    flagUpdate.allowList = flagUpdate.allowList.filter((id) => {
      return id !== entityId;
    });
  }
  await doCloudFetch(
    browser,
    `${ATLAS_CLOUD_TEST_UTILS.featureFlags}/${flagDescription.id}`,
    { method: 'PATCH' },
    {
      json: {
        allowList: flagUpdate.allowList.join(','),
        blockList: flagUpdate.blockList.join(','),
      },
    }
  );
  await doCloudFetch(browser, ATLAS_CLOUD_TEST_UTILS.refreshFeatureFlags);
}
