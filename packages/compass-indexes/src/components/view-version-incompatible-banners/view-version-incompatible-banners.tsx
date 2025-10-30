import {
  Banner,
  BannerVariant,
  Button,
  css,
} from '@mongodb-js/compass-components';
import { getAtlasUpgradeClusterLink } from '../../utils/atlas-upgrade-cluster-link';
import React from 'react';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';
import { VIEW_PIPELINE_UTILS } from '@mongodb-js/mongodb-constants';

const viewContentStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
});

export const ViewVersionIncompatibleBanner = ({
  serverVersion,
  enableAtlasSearchIndexes,
  atlasMetadata,
}: {
  serverVersion: string;
  enableAtlasSearchIndexes: boolean;
  atlasMetadata: AtlasClusterMetadata | undefined;
}) => {
  // return if compatible, 8.1+ for compass and 8.0+ for data explorer
  if (
    VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(
      serverVersion
    ) ||
    (VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsDataExplorer(
      serverVersion
    ) &&
      !enableAtlasSearchIndexes)
  ) {
    return null;
  }

  const searchIndexOnViewsMinVersion = enableAtlasSearchIndexes ? '8.1' : '8.0';
  // if compass version matches min compatibility for DE, we recommend Atlas UI as well
  const recommendedCta =
    enableAtlasSearchIndexes &&
    VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsDataExplorer(
      serverVersion
    )
      ? 'Upgrade your cluster or manage search indexes on views in the Atlas UI.'
      : 'Upgrade your cluster to create search indexes on views.';
  return (
    <Banner
      variant={BannerVariant.Warning}
      data-testid="view-version-incompatible-banner"
    >
      <b>Looking for search indexes?</b>
      <br />
      <div className={viewContentStyles}>
        <span>
          Your MongoDB version is {serverVersion}. Creating and managing search
          indexes on views {enableAtlasSearchIndexes && 'in Compass'} is
          supported on MongoDB version {searchIndexOnViewsMinVersion} or higher.{' '}
          {recommendedCta}
        </span>
        {atlasMetadata && (
          <Button
            size="xsmall"
            href={getAtlasUpgradeClusterLink({
              clusterName: atlasMetadata.clusterName,
            })}
            target="_blank"
            style={{ textDecoration: 'none' }}
          >
            Upgrade Cluster
          </Button>
        )}
      </div>
    </Banner>
  );
};
