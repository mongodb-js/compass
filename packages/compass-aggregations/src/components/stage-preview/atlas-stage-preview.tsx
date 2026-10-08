import React from 'react';
import {
  Button,
  css,
  spacing,
  AtlasNavGraphic,
  Body,
  useTranslation,
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

const ATLAS_LINK = 'https://www.mongodb.com/cloud/atlas/lp/search-1';

const atlasContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: spacing[800],
  gap: spacing[400],
  textAlign: 'center',
});

const atlasTextStyles = css({
  maxWidth: '400px',
});

export const AtlasStagePreview = ({
  stageOperator,
}: {
  stageOperator: string;
}) => {
  const track = useTelemetry();
  const t = useTranslation();
  return (
    <div
      className={atlasContainerStyles}
      data-testid="atlas-only-stage-preview"
    >
      <AtlasNavGraphic />
      <Body
        data-testid="stage-preview-missing-search-support"
        className={atlasTextStyles}
      >
        {t(
          'aggregations.atlasStagePreview',
          'The {stageOperator} stage is only available with MongoDB Atlas. Create a free cluster or connect to an Atlas cluster to build search indexes and use {stageOperator} aggregation stage to run fast, relevant search queries.',
          { stageOperator }
        )}
      </Body>
      <Button
        href={ATLAS_LINK}
        target="_blank"
        onClick={() => {
          track('Atlas Link Clicked', { screen: 'agg_builder' });
        }}
        variant="primary"
      >
        {t('aggregations.createFreeCluster', 'Create free cluster')}
      </Button>
    </div>
  );
};
