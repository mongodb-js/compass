import React from 'react';
import { connect } from 'react-redux';

import { css, spacing, Link, Banner } from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import type { RootState } from '../modules';
import { getAtlasSearchIndexesLink } from '../utils/atlas-search-indexes-link';

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
  const message =
    'Results shown are based on the most recently built index version.';

  const href =
    !!atlasMetadata?.clusterName && searchIndexName
      ? getAtlasSearchIndexesLink({
          clusterName: atlasMetadata.clusterName,
          namespace,
          indexName: searchIndexName,
        })
      : null;

  return showBanner ? (
    <Banner
      variant="info"
      title={message}
      className={bannerStyles}
      dismissible
      onClose={() => setShowBanner(false)}
    >
      {message} {href && <Link href={href}>View Index Definition</Link>}
    </Banner>
  ) : null;
}

export default connect((state: RootState) => ({
  namespace: state.namespace,
}))(SearchIndexStaleResultsBanner);
