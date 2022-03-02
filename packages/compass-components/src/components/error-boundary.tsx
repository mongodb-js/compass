import type { ErrorInfo } from 'react';
import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { Banner } from './leafygreen';

const errorContainerStyles = css({
  padding: spacing[3],
  width: '100%',
});

type State = {
  error: Error | null;
};

type Props = {
  displayName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: React.ReactElement;
};

export class ErrorBoundary extends React.Component<Props> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): React.ReactNode {
    const { displayName } = this.props;
    const { error } = this.state;

    if (error) {
      return (
        <div className={errorContainerStyles}>
          <Banner variant="danger">
            An error occurred while rendering
            {displayName ? ` ${displayName}` : ''}: {error.message}
          </Banner>
        </div>
      );
    }
    return this.props.children;
  }
}
