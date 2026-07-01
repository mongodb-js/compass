import React, { useEffect } from 'react';
import {
  Banner,
  Button,
  Icon,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { buildUpgradeClusterUrl } from '@mongodb-js/atlas-service/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { RERANK_MIN_SERVER_VERSION } from '../utils/search-stage-errors';

const bannerContentStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: spacing[200],
  flexWrap: 'nowrap',
});

const bannerButtonStyles = css({
  flexShrink: 0,
  whiteSpace: 'nowrap',
});

export const RerankVersionWarningBanner = ({
  'data-testid': dataTestId,
}: {
  'data-testid'?: string;
}) => {
  const { atlasMetadata } = useConnectionInfo();
  const track = useTelemetry();

  useEffect(() => {
    track('Rerank Version Warning Banner Shown', {
      context: 'Rerank Version Warning Banner',
    });
  }, [track]);

  const upgradeClusterHref = atlasMetadata
    ? buildUpgradeClusterUrl(atlasMetadata)
    : 'https://www.mongodb.com/docs/atlas/tutorial/major-version-change/';

  return (
    <Banner variant="danger" data-testid={dataTestId}>
      <div className={bannerContentStyles}>
        <span>
          Upgrade your cluster to MongoDB {RERANK_MIN_SERVER_VERSION}+ to use
          $rerank.
        </span>
        <Button
          size="xsmall"
          onClick={() => {
            track('Rerank Upgrade Cluster Button Clicked', {
              context: 'Rerank Version Warning Banner',
            });
            window.open(upgradeClusterHref, '_blank', 'noopener noreferrer');
          }}
          rightGlyph={<Icon glyph="OpenNewTab" />}
          className={bannerButtonStyles}
        >
          Upgrade Cluster
        </Button>
      </div>
    </Banner>
  );
};
