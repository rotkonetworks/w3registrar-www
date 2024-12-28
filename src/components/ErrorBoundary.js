import React from 'react';

export class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Detailed error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }
  
  render() {
    return this.props.children;
  }
}
