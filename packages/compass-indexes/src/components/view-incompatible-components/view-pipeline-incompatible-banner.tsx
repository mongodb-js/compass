import { Banner, Link, useTranslation } from '@mongodb-js/compass-components';
import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';

type ViewSearchIncompatibleBannerProps = {
  hasNoSearchIndexes: boolean;
};

const ViewPipelineIncompatibleBanner = ({
  hasNoSearchIndexes,
}: ViewSearchIncompatibleBannerProps) => {
  const t = useTranslation();
  return (
    <Banner
      variant={hasNoSearchIndexes ? 'warning' : 'danger'}
      data-testid="view-not-search-compatible-banner"
    >
      {hasNoSearchIndexes && (
        <>
          <b>
            {t(
              'indexes.viewBanner.lookingForSearch',
              'Looking for search indexes?'
            )}
          </b>{' '}
          <br />
        </>
      )}
      {t(
        'indexes.viewBanner.pipelineIncompatible',
        'This view is incompatible with search indexes. Only views containing $match stages with the $expr operator, $addFields, or $set are compatible with search indexes.'
      )}{' '}
      {!hasNoSearchIndexes &&
        t(
          'indexes.viewBanner.editView',
          'Edit the view to rebuild search indexes.'
        )}{' '}
      <Link
        href={'https://www.mongodb.com/docs/atlas/atlas-search/view-support/'}
        hideExternalIcon
      >
        {t('indexes.viewBanner.learnMore', 'Learn more.')}
      </Link>
    </Banner>
  );
};

const mapState = ({ searchIndexes }: RootState) => ({
  hasNoSearchIndexes: searchIndexes.indexes.length === 0,
});

export default connect(mapState)(ViewPipelineIncompatibleBanner);
