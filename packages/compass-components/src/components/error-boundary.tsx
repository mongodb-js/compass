import type { ErrorInfo } from 'react';
import React from 'react';
import Banner from '@leafygreen-ui/banner';
import { css } from '@leafygreen-ui/emotion';

const errorContainerStyles = css({
  width: '100%',
});

type State = {
  error: Error | null;
};

type Props = {
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
    const { error } = this.state;

    if (error) {
      return (
        <div className={errorContainerStyles}>
          <Banner variant="danger">
            An error occurred while rendering: {error.message}
          </Banner>
        </div>
      );
    }
    return this.props.children;
  }
}
