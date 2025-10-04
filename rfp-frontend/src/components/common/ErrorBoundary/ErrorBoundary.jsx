import React from 'react';
import PropTypes from 'prop-types';
import './ErrorBoundary.scss';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // In production, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    // Log the error report (in production, this would be sent to an external service)
    console.log('Error report:', errorReport);

    // Example: Send to external service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport),
    // }).catch(console.error);
  };

  getCurrentUserId = () => {
    // Get current user ID from localStorage or context
    try {
      const userData = localStorage.getItem('rfp_user_data');
      return userData ? JSON.parse(userData).id : null;
    } catch {
      return null;
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='error-boundary'>
          <div className='error-boundary__content'>
            <div className='error-boundary__icon'>
              <svg
                width='64'
                height='64'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
              </svg>
            </div>

            <h2 className='error-boundary__title'>
              {this.props.title || 'Something went wrong'}
            </h2>

            <p className='error-boundary__message'>
              {this.props.message ||
                'We encountered an unexpected error. Please try again.'}
            </p>

            {this.props.showDetails && this.state.error && (
              <details className='error-boundary__details'>
                <summary>Error Details</summary>
                <pre className='error-boundary__error'>
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className='error-boundary__actions'>
              <button
                className='btn btn--primary'
                onClick={this.handleRetry}
                type='button'
              >
                Try Again
              </button>

              <button
                className='btn btn--secondary'
                onClick={() => window.location.reload()}
                type='button'
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  title: PropTypes.string,
  message: PropTypes.string,
  showDetails: PropTypes.bool,
};

ErrorBoundary.defaultProps = {
  showDetails: process.env.NODE_ENV === 'development',
};

export default ErrorBoundary;
