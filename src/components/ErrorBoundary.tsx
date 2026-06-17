import { Component, type ReactNode, type ErrorInfo } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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
