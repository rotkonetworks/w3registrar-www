import React from 'react';

export class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) console.error('Detailed error:', error);
    if (import.meta.env.DEV) console.error('Component stack:', errorInfo.componentStack);
  }
  
  render() {
    return this.props.children;
  }
}
