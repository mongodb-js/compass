import {
  Banner,
  BannerVariant,
  Button,
  css,
} from '@mongodb-js/compass-components';
import { getAtlasUpgradeClusterLink } from '../../utils/atlas-upgrade-cluster-link';
import React from 'react';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';
import { isVersionSearchCompatibleForViews } from '../../modules/search-indexes';
import { isVersionSearchCompatibleForViewsDataExplorer } from '../indexes/indexes';

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
    isVersionSearchCompatibleForViews(serverVersion) ||
    (isVersionSearchCompatibleForViewsDataExplorer(serverVersion) &&
      !enableAtlasSearchIndexes)
  ) {
    return null;
  }

  const searchIndexOnViewsMinVersion = enableAtlasSearchIndexes ? '8.1' : '8.0';
  // if compass version matches min compatibility for DE, we recommend Atlas UI as well
  const recommendedCta =
    enableAtlasSearchIndexes &&
    isVersionSearchCompatibleForViewsDataExplorer(serverVersion)
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
          >
            Upgrade Cluster
          </Button>
        )}
      </div>
    </Banner>
  );
};
