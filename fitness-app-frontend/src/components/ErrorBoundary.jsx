import React from 'react';
import Icon from './Icons';
import logger from '../utils/logger';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log del error usando el sistema de logging
        logger.error('Error capturado por ErrorBoundary:', error, errorInfo);
        
        this.setState({
            error,
            errorInfo
        });

        // Enviar el error a un servicio de logging (Sentry, LogRocket, etc.)
        if (typeof window !== 'undefined' && window.Sentry) {
            window.Sentry.captureException(error, { 
                contexts: { 
                    react: { componentStack: errorInfo.componentStack } 
                },
                tags: {
                    component: 'ErrorBoundary'
                }
            });
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#FAF3E1] dark:bg-black flex items-center justify-center p-4" role="alert" aria-live="assertive">
                    <div className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-3xl border border-red-200 dark:border-red-800 p-8 shadow-lg">
                        <div className="text-center mb-6">
                            <div className="flex justify-center mb-4" aria-hidden="true">
                                <Icon name="warning" className="w-16 h-16 text-red-500 dark:text-red-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Algo salió mal
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
                            </p>
                        </div>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                <details className="text-sm">
                                    <summary className="cursor-pointer font-semibold text-red-600 dark:text-red-400 mb-2">
                                        Detalles del error (solo en desarrollo)
                                    </summary>
                                    <pre className="text-xs text-red-800 dark:text-red-300 overflow-auto max-h-64">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center" role="group" aria-label="Acciones de recuperación">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                aria-label="Volver al dashboard principal"
                            >
                                Volver al Dashboard
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-gray-600 dark:bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                aria-label="Recargar la página completa"
                            >
                                Recargar Página
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

