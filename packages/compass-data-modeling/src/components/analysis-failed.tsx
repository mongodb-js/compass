import React from 'react';
import { Banner, Button, css, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { retryAnalysis } from '../store/analysis-process';

const bannerStyles = css({
  margin: spacing[200],
  '& > div': {
    display: 'flex',
    alignItems: 'center',
  },
});

const bannerButtonStyles = css({
  marginLeft: 'auto',
});

const AnalysisFailed = ({
  error,
  onRetryClick,
}: {
  error: Error | null;
  onRetryClick: () => void;
}) => {
  return (
    <Banner variant="danger" className={bannerStyles}>
      <div>Analysis failed: {error?.message}</div>
      <Button
        className={bannerButtonStyles}
        size="xsmall"
        onClick={onRetryClick}
      >
        Retry
      </Button>
    </Banner>
  );
};

export default connect(
  ({ step, analysisProgress: { error } }: DataModelingState) => {
    if (step !== 'ANALYSIS_FAILED') {
      throw new Error('Unexpected state when analyzing collections failed');
    }
    return { error };
  },
  {
    onRetryClick: retryAnalysis,
  }
)(AnalysisFailed);
