import React from 'react';
import {
  Button,
  css,
  spacing,
  AtlasNavGraphic,
  Body,
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

const ATLAS_LINK = 'https://www.mongodb.com/cloud/atlas/lp/search-1';

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

export const AtlasStagePreview = ({
  stageOperator,
}: {
  stageOperator: string;
}) => {
  const track = useTelemetry();
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
        The {stageOperator} stage is only available with MongoDB Atlas. Create a
        free cluster or connect to an Atlas cluster to build search indexes and
        use {stageOperator} aggregation stage to run fast, relevant search
        queries.
      </Body>
      <Button
        href={ATLAS_LINK}
        target="_blank"
        onClick={() => {
          track('Atlas Link Clicked', { screen: 'agg_builder' as const });
        }}
        variant="primary"
      >
        Create free cluster
      </Button>
    </div>
  );
};
