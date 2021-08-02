import React from 'react';

type Props = {
  children: React.ReactNode
};

class ErrorBoundary extends React.Component<Props> {
  static displayName = 'ErrorBoundary';

  state = { hasError: false };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    console.error('Error mounting component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Error rendering component (TODO: Descriptive).</h1>;
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
