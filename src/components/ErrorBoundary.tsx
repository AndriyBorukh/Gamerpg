import { Component, ReactNode, ErrorInfo } from 'react';
import { ShieldAlert, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// Robust ErrorBoundary supporting all React typing configurations
export class ErrorBoundary extends (Component as any)<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0d0906] flex items-center justify-center p-4 select-none">
                    <div className="max-w-md w-full bg-[#18110b] border-2 border-[#b8860b] rounded-2xl p-6 shadow-2xl text-center relative overflow-hidden">
                        <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500/80 mx-auto mb-4 flex items-center justify-center shadow-[0_0_24px_rgba(239,68,68,0.5)]">
                            <ShieldAlert className="w-8 h-8 text-red-400" />
                        </div>

                        <div className="text-[11px] font-mono tracking-widest text-amber-500 uppercase mb-1">
                            {this.props.fallbackTitle || 'Захист Королівства • Tavern Journey'}
                        </div>
                        <h2 className="text-xl font-serif font-black text-amber-100 mb-2">
                            Тимчасовий збій графічного відображення
                        </h2>
                        <p className="text-xs text-stone-300 mb-6 leading-relaxed">
                            Сталася непередбачена помилка відображення інтерфейсу або брак відеопам'яті. 
                            Ваш прогрес у безпеці та збережений у скринях подорожника.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black text-xs rounded-xl shadow-lg border border-yellow-300 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                            >
                                <Sparkles className="w-4 h-4 text-stone-950" />
                                Спробувати знову
                            </button>

                            <button
                                onClick={this.handleReload}
                                className="w-full sm:w-auto px-5 py-2.5 bg-[#251810] hover:bg-[#342217] text-amber-200 font-bold text-xs rounded-xl border border-amber-600/50 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4 text-amber-400" />
                                Перезавантажити
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
