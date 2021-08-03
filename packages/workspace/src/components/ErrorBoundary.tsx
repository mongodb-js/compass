import React from 'react';

type Props = {
  children: React.ReactNode
};

class ErrorBoundary extends React.Component<Props> {
  static displayName = 'ErrorBoundary';

  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    console.debug(error);
    console.debug(errorInfo);

    // console.error('Error mounting component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // TODO: Nice descriptive errors
      return <h1>Error rendering component</h1>;
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
