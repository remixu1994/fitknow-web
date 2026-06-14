import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[FitKnow ErrorBoundary]', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <div className="error-icon">⚠️</div>
          <h1>页面加载出错了</h1>
          <p>抱歉，发生了意外错误。请尝试刷新页面。</p>
          {import.meta.env.DEV && this.state.error && (
            <details className="error-details">
              <summary>错误详情（开发模式）</summary>
              <pre>{this.state.error.toString()}</pre>
              {this.state.errorInfo && <pre>{this.state.errorInfo.componentStack}</pre>}
            </details>
          )}
          <button className="error-refresh-btn" onClick={this.handleRefresh}>
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
