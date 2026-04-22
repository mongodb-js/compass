import React from 'react';
import { connect } from 'react-redux';
import { buildAtlasSearchLink } from '@mongodb-js/atlas-service/provider';

import { css, spacing, Link, Banner } from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import type { RootState } from '../modules';

const bannerStyles = css({
  flex: 'none',
  marginTop: spacing[200],
  marginLeft: spacing[200],
  marginRight: spacing[200],
  textAlign: 'left',
});

type SearchIndexStaleResultsBannerProps = {
  searchIndexName: string | null;
  namespace: string;
};

function SearchIndexStaleResultsBanner({
  searchIndexName,
  namespace,
}: SearchIndexStaleResultsBannerProps) {
  const [showBanner, setShowBanner] = React.useState(true);
  const { atlasMetadata } = useConnectionInfo();
  const track = useTelemetry();
  const message =
    'Results shown are based on the most recently built index version.';

  const href =
    atlasMetadata && searchIndexName
      ? buildAtlasSearchLink({
          atlasMetadata,
          namespace,
          indexName: searchIndexName,
        })
      : null;

  return showBanner ? (
    <Banner
      variant="info"
      data-testid="search-index-stale-results-banner"
      title={message}
      className={bannerStyles}
      dismissible
      onClose={() => setShowBanner(false)}
    >
      {message}{' '}
      {href && (
        <Link
          href={href}
          onClick={() => {
            track('Search Index View Definition Link Clicked', {
              context: 'Search Index Stale Results Banner',
            });
          }}
        >
          View Index Definition
        </Link>
      )}
    </Banner>
  ) : null;
}

export default connect((state: RootState) => ({
  namespace: state.namespace,
}))(SearchIndexStaleResultsBanner);
