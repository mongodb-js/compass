import React from 'react';
import { ErrorSummary } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { type RootState, ShardingStatuses } from '../../store/reducer';
import { containerStyles } from '../common-styles';

interface LoadingErrorProps {
  error: string;
}

export function LoadingError({ error }: LoadingErrorProps) {
  return (
    <div className={containerStyles}>
      <ErrorSummary errors={error} />
    </div>
  );
}

export default connect((state: RootState) => {
  if (state.status !== ShardingStatuses.LOADING_ERROR) {
    throw new Error('Error not found in LoadingError');
  }
  return {
    error: state.loadingError,
  };
})(LoadingError);
