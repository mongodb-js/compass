import React from 'react';
import { Banner, css, spacing, Button } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { retryAnalysis } from '../../store/analysis-process';

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

const ErrorState: React.FunctionComponent<{
  onRetryClick: () => void;
}> = ({ onRetryClick }) => {
  return (
    <Banner variant="danger" className={bannerStyles}>
      <div>Analysis Cancelled</div>
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

export default connect(null, {
  onRetryClick: retryAnalysis,
})(ErrorState);
