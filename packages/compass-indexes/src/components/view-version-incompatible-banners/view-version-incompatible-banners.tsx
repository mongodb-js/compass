import {
  Banner,
  BannerVariant,
  Button,
  css,
} from '@mongodb-js/compass-components';
import { getAtlasUpgradeClusterLink } from '../../utils/atlas-upgrade-cluster-link';
import React from 'react';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';
import { compareVersionForViewCompatibility } from '../indexes/indexes';

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
  const searchIndexOnViewsVersion = enableAtlasSearchIndexes ? '8.1' : '8.0';

  if (
    compareVersionForViewCompatibility(serverVersion) ||
    (compareVersionForViewCompatibility(serverVersion, 'gte', '8.0.0') &&
      !enableAtlasSearchIndexes)
  ) {
    // return if 8.1+ on compass or 8.0+ for data explorer
    return null;
  }

  if (compareVersionForViewCompatibility(serverVersion, 'lt', '8.0.0')) {
    // data explorer <8.0 and compass <8.0
    return (
      <Banner
        variant={BannerVariant.Warning}
        data-testid="upgrade-cluster-banner-less-than-8.0"
      >
        <b>Looking for search indexes?</b>
        <br />
        <div className={viewContentStyles}>
          <span>
            Your MongoDB version is {serverVersion}. Creating and managing
            search indexes on views {enableAtlasSearchIndexes && 'in Compass'}{' '}
            is supported on MongoDB version {searchIndexOnViewsVersion} or
            higher. Upgrade your cluster to create search indexes on views.
          </span>
          {atlasMetadata && (
            <Button
              size="xsmall"
              onClick={() => {
                window.open(
                  getAtlasUpgradeClusterLink({
                    clusterName: atlasMetadata.clusterName,
                  }),
                  '_blank'
                );
              }}
            >
              Upgrade Cluster
            </Button>
          )}
        </div>
      </Banner>
    );
  }

  if (
    compareVersionForViewCompatibility(serverVersion, 'gte', '8.0.0') &&
    compareVersionForViewCompatibility(serverVersion, 'lt', '8.1.0') &&
    enableAtlasSearchIndexes
  ) {
    // compass 8.0
    return (
      <Banner
        variant={BannerVariant.Warning}
        data-testid="upgrade-cluster-banner-8.0"
      >
        <b>Looking for search indexes?</b>
        <br />
        <div className={viewContentStyles}>
          <span>
            Your MongoDB version is {serverVersion}. Creating and managing
            search indexes on views in Compass is supported on MongoDB version{' '}
            {searchIndexOnViewsVersion} or higher. Upgrade your cluster or
            manage search indexes on views in the Atlas UI.
          </span>
        </div>
      </Banner>
    );
  }
  return null;
};
