import {
  Banner,
  BannerVariant,
  Button,
  css,
} from '@mongodb-js/compass-components';
import { getAtlasUpgradeClusterLink } from '../../utils/atlas-upgrade-cluster-link';
import { getAtlasSearchIndexesLink } from '../../utils/atlas-search-indexes-link';
import React from 'react';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';

const viewContentStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
});

export const ViewVersionIncompatibleBanner = ({
  namespace,
  serverVersion,
  mongoDBMajorVersion,
  enableAtlasSearchIndexes,
  atlasMetadata,
}: {
  namespace: string;
  serverVersion: string;
  mongoDBMajorVersion: number;
  enableAtlasSearchIndexes: boolean;
  atlasMetadata: AtlasClusterMetadata | undefined;
}) => {
  const searchIndexOnViewsVersion = enableAtlasSearchIndexes ? '8.1' : '8.0';

  if (
    mongoDBMajorVersion > 8.0 ||
    (mongoDBMajorVersion === 8.0 && !enableAtlasSearchIndexes)
  ) {
    // return if 8.1+ or 8.0+ for data explorer
    return null;
  }

  if (mongoDBMajorVersion < 8.0) {
    // data explorer <8.0 and compass <8.0
    return (
      <Banner variant={BannerVariant.Warning}>
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

  if (mongoDBMajorVersion === 8.0 && enableAtlasSearchIndexes) {
    // compass 8.0
    return (
      <Banner variant={BannerVariant.Warning}>
        <b>Looking for search indexes?</b>
        <br />
        <div className={viewContentStyles}>
          <span>
            Your MongoDB version is {serverVersion}. Creating and managing
            search indexes on views in Compass is supported on MongoDB version{' '}
            {searchIndexOnViewsVersion} or higher. Upgrade your cluster or
            manage search indexes on views in the Atlas UI.
          </span>
          {atlasMetadata && (
            <Button
              size="xsmall"
              onClick={() => {
                window.open(
                  getAtlasSearchIndexesLink({
                    clusterName: atlasMetadata.clusterName,
                    namespace,
                  }),
                  '_blank'
                );
              }}
            >
              Go to Atlas
            </Button>
          )}
        </div>
      </Banner>
    );
  }
  return null;
};
