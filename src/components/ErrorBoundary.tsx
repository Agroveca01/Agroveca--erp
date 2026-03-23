import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-8">
          <div className="glass-card rounded-2xl p-8 max-w-lg border border-[#30363d] shadow-2xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-red-900/30 p-4 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Error de Renderizado</h2>
                <p className="text-slate-400 mt-1">Ocurrió un problema al mostrar este módulo</p>
              </div>
            </div>
            <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d] mb-6">
              <p className="text-sm text-slate-300 font-mono">
                {this.state.error?.message || 'Error desconocido'}
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn-primary w-full"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
