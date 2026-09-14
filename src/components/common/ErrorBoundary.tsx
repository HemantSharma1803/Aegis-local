import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Aegis Local ErrorBoundary] Caught render exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetWorkspace = () => {
    if (
      window.confirm(
        'Are you sure you want to reset corrupted local session cache? Your project manifests will be preserved.'
      )
    ) {
      try {
        // Clear session keys only
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith('aegis_local_judge_') ||
              key.startsWith('aegis_local_voice_') ||
              key.startsWith('aegis_local_chat_'))
          ) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // ignore
      }
      this.setState({ hasError: false, error: null, errorInfo: null });
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-[#0e1017] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-zinc-100">Workspace Recovery</h1>
                <p className="text-xs text-zinc-400">Aegis Local encountered an unhandled interface exception</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-900 text-xs font-mono text-zinc-300 break-words leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </div>

            <div className="text-[11px] text-zinc-400 leading-relaxed">
              Your project files and local knowledge base remain safely stored on your device. You can reload the application or clear transient session states.
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={this.handleReload}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reload App
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleResetWorkspace}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Clear Transient Cache
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
