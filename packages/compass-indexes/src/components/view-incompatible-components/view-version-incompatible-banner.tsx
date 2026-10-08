import {
  Banner,
  BannerVariant,
  Button,
  css,
  useTranslation,
} from '@mongodb-js/compass-components';
import { buildUpgradeClusterUrl } from '@mongodb-js/atlas-service/provider';
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
  const t = useTranslation();

  // if compass version matches min compatibility for DE, we recommend Atlas UI as well
  const recommendedCta = isAtlas
    ? t(
        'indexes.viewVersionBanner.upgradeAtlas',
        'Upgrade your cluster or manage search indexes on views in the Atlas UI.'
      )
    : t(
        'indexes.viewVersionBanner.upgrade',
        'Upgrade your cluster to create search indexes on views.'
      );
  return (
    <Banner
      variant={BannerVariant.Warning}
      data-testid="view-version-incompatible-banner"
    >
      <b>
        {t(
          'indexes.viewBanner.lookingForSearch',
          'Looking for search indexes?'
        )}
      </b>
      <br />
      <div className={viewContentStyles}>
        <span>
          {isAtlas
            ? t(
                'indexes.viewVersionBanner.messageAtlas',
                'Your MongoDB version is {serverVersion}. Creating and managing search indexes on views is supported on MongoDB version 8.1 or higher.',
                { serverVersion }
              )
            : t(
                'indexes.viewVersionBanner.messageCompass',
                'Your MongoDB version is {serverVersion}. Creating and managing search indexes on views in Compass is supported on MongoDB version 8.1 or higher.',
                { serverVersion }
              )}{' '}
          {recommendedCta}
        </span>
        {isAtlas && (
          <Button
            size="xsmall"
            href={buildUpgradeClusterUrl(atlasMetadata)}
            target="_blank"
          >
            {t('indexes.viewVersionBanner.upgradeCluster', 'Upgrade Cluster')}
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
