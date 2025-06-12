import React from 'react';
import { CancelLoader, css, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { cancelAnalysis } from '../../store/analysis-process';

const loadingContainerStyles = css({
  width: '100%',
  paddingTop: spacing[1800] * 3,
});

const loaderStyles = css({
  margin: '0 auto',
});

const AnalyzingState: React.FunctionComponent<{
  onCancelClick: () => void;
}> = ({ onCancelClick }) => {
  return (
    <div className={loadingContainerStyles}>
      <CancelLoader
        className={loaderStyles}
        progressText="Analyzing …"
        cancelText="Cancel"
        onCancel={onCancelClick}
      ></CancelLoader>
    </div>
  );
};

export default connect(null, {
  onCancelClick: cancelAnalysis,
})(AnalyzingState);
