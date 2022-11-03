import React from 'react';
import {
  Button,
  css,
  spacing,
  AtlasLogoMark,
  Body,
} from '@mongodb-js/compass-components';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const ATLAS_LINK =
  'https://www.mongodb.com/cloud/atlas/lp/search-1?utm_campaign=atlas_search&utm_source=compass&utm_medium=product&utm_content=v1';

const atlasContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: spacing[5],
  gap: spacing[3],
  textAlign: 'center',
});

const atlasTextStyles = css({
  maxWidth: '400px',
});

export const AtlastStagePreivew = ({
  stageOperator,
}: {
  stageOperator: string;
}) => {
  return (
    <div
      className={atlasContainerStyles}
      data-testid="atlas-only-stage-preview"
    >
      <AtlasLogoMark size={30} />
      <Body
        data-testid="stage-preview-missing-search-support"
        className={atlasTextStyles}
      >
        This stage is only available with MongoDB Atlas. Create a free cluster
        or connect to an Atlas cluster to build search indexes and use{' '}
        {stageOperator} aggregation stage to run fast, relevant search queries.
      </Body>
      <Button
        href={ATLAS_LINK}
        target="_blank"
        onClick={() => {
          track('Atlas Link Clicked', { screen: 'agg_builder' });
        }}
        variant="primary"
      >
        Create free cluster
      </Button>
    </div>
  );
};
