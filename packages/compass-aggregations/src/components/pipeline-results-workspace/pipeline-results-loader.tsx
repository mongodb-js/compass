import React from 'react';
import {
  css,
  spacing,
  uiColors,
  SpinLoader,
  Button,
  Subtitle,
} from '@mongodb-js/compass-components';

type PipelineResultsLoaderProps = {
  loading: boolean;
  onCancel: () => void;
};

const centeredContentStyles = css({
  display: 'flex',
  gap: spacing[2],
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
});

const textStyles = css({
  color: uiColors.green.dark2,
});

export const PipelineResultsLoader: React.FunctionComponent<PipelineResultsLoaderProps> =
  ({ onCancel, loading }) => {
    if (!loading) {
      return null;
    }
    return (
      <div
        className={centeredContentStyles}
        data-testid="pipeline-results-loader"
      >
        <SpinLoader size="24px" />
        <Subtitle className={textStyles}>Running aggregation</Subtitle>
        <Button
          data-testid="pipeline-results-cancel-action"
          variant="primaryOutline"
          onClick={() => onCancel()}
        >
          Stop
        </Button>
      </div>
    );
  };

export default PipelineResultsLoader;
