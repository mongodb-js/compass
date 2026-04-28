import React from 'react';
import {
  Banner,
  Button,
  Icon,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
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
  'data-testid': string;
}) => {
  const { atlasMetadata } = useConnectionInfo();
  const upgradeClusterHref = atlasMetadata
    ? `#/clusters/edit/${encodeURIComponent(atlasMetadata.clusterName)}`
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
          href={upgradeClusterHref}
          target="_blank"
          rightGlyph={<Icon glyph="OpenNewTab" />}
          className={bannerButtonStyles}
        >
          Upgrade Cluster
        </Button>
      </div>
    </Banner>
  );
};
