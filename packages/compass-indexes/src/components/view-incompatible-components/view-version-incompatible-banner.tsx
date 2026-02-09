import {
  Banner,
  BannerVariant,
  Button,
  css,
} from '@mongodb-js/compass-components';
import { getAtlasUpgradeClusterLink } from '../../utils/atlas-upgrade-cluster-link';
import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';

const viewContentStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
});

type ViewVersionIncompatibleBannerProps = {
  serverVersion: string;
};

const ViewVersionIncompatibleBanner = ({
  serverVersion,
}: ViewVersionIncompatibleBannerProps) => {
  const { atlasMetadata } = useConnectionInfo();
  const isAtlas = !!atlasMetadata;

  // return if compatible, 8.1+ for compass and 8.0+ for data explorer
  const searchIndexOnViewsMinVersion = isAtlas ? '8.0' : '8.1';
  // if compass version matches min compatibility for DE, we recommend Atlas UI as well
  const recommendedCta = isAtlas
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
          indexes on views {!isAtlas && 'in Compass'} is
          supported on MongoDB version {searchIndexOnViewsMinVersion} or higher.{' '}
          {recommendedCta}
        </span>
        {isAtlas && (
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

const mapState = ({ serverVersion }: RootState) => ({
  serverVersion,
});

export default connect(mapState)(ViewVersionIncompatibleBanner);
