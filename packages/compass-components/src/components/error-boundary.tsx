import type { ErrorInfo } from 'react';
import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { Banner } from './leafygreen';
import { useTranslation } from '../i18n';

const errorContainerStyles = css({
  padding: spacing[400],
  width: '100%',
});

type State = {
  error: Error | null;
};

type Props = {
  className?: string;
  displayName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children?: React.ReactNode;
};

const ErrorBoundaryMessage: React.FunctionComponent<{
  displayName?: string;
  message: string;
}> = ({ displayName, message }) => {
  const t = useTranslation();
  return (
    <>
      {displayName
        ? t(
            'components.errorBoundary.messageWithName',
            'An error occurred while rendering {name}: {message}',
            { name: displayName, message }
          )
        : t(
            'components.errorBoundary.message',
            'An error occurred while rendering: {message}',
            { message }
          )}
    </>
  );
};

class ErrorBoundary extends React.Component<Props> {
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
    const { className, displayName } = this.props;
    const { error } = this.state;

    if (error) {
      return (
        <div className={cx(errorContainerStyles, className)}>
          <Banner variant="danger">
            <ErrorBoundaryMessage
              displayName={displayName}
              message={error.message}
            />
          </Banner>
        </div>
      );
    }
    return this.props.children;
  }
}

const _ErrorBoundary: React.FunctionComponent<Props> = (props) => {
  // Error boundary messes up with hot reload in dev mode (if your component
  // breaks you forever stuck with the boundary error screen until you hard
  // reload) so sometimes you would want this to be disabled
  return process?.env?.COMPASS_DISABLE_ERROR_BOUNDARY === 'true' ? (
    <>{props.children}</>
  ) : (
    <ErrorBoundary {...props}></ErrorBoundary>
  );
};

export { _ErrorBoundary as ErrorBoundary };
