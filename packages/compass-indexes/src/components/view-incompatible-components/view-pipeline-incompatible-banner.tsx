import { Banner, Link } from '@mongodb-js/compass-components';
import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import type { SearchIndex } from 'mongodb-data-service';

type ViewSearchIncompatibleBannerProps = {
  searchIndexes: SearchIndex[];
};

const ViewPipelineIncompatibleBanner = ({
  searchIndexes,
}: ViewSearchIncompatibleBannerProps) => {
  const hasNoSearchIndexes = searchIndexes.length === 0;
  return (
    <Banner
      variant={hasNoSearchIndexes ? 'warning' : 'danger'}
      data-testid="view-not-search-compatible-banner"
    >
      {!hasNoSearchIndexes && (
        <>
          <b>Looking for search indexes?</b> <br />
        </>
      )}
      This view is incompatible with search indexes. Only views containing
      $match stages with the $expr operator, $addFields, or $set are compatible
      with search indexes.{' '}
      {!hasNoSearchIndexes && 'Edit the view to rebuild search indexes.'}{' '}
      <Link
        href={'https://www.mongodb.com/docs/atlas/atlas-search/view-support/'}
        hideExternalIcon
      >
        Learn more.
      </Link>
    </Banner>
  );
};

const mapState = ({ searchIndexes }: RootState) => ({
  searchIndexes: searchIndexes.indexes,
});

export default connect(mapState)(ViewPipelineIncompatibleBanner);
