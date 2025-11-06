import { Component, ReactNode, ErrorInfo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-professional gradient-mesh">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full glass-professional p-8 rounded-3xl border border-white/20"
            role="alert"
            aria-live="assertive"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" aria-hidden="true" />
              </div>
              
              <h1 className="text-2xl font-bold text-neutral mb-2">
                Oops! Something went wrong
              </h1>
              
              <p className="text-neutral-light mb-6">
                We apologize for the inconvenience. The application encountered an unexpected error.
              </p>

              {this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-neutral-light hover:text-neutral transition-colors">
                    View error details
                  </summary>
                  <pre className="mt-2 p-3 bg-neutral-900/20 rounded-lg text-xs overflow-auto max-h-40">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 btn-professional px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                  aria-label="Try again"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex-1 btn-professional px-4 py-3 glass-professional rounded-xl hover:bg-accent-500/10 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                  aria-label="Reload page"
                >
                  <Home className="w-4 h-4" />
                  Reload Page
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
