import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { clearPersistentData } from '../utils/persistentStorage.ts';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleSafeReset = async () => {
    try {
      await clearPersistentData();
      localStorage.removeItem('futarisousa_persistent_data_backup_v1');
      await fetch('/api/all/clear', {
        method: 'POST',
        headers: {
          'x-edit-passkey': 'futarisousa',
        },
      });
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-serif">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border-2 border-stone-800 p-6 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold font-detective-title text-stone-900">
                {this.props.fallbackTitle || '画面の描画中に問題が発生しました'}
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                データの追加または更新処理中に予期しないエラーが検出されました。
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-left text-xs font-mono text-stone-700 max-h-24 overflow-y-auto break-all">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>画面を再読み込み</span>
              </button>
              <button
                type="button"
                onClick={this.handleSafeReset}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="破損したローカルデータを安全に初期化して復旧"
              >
                <Home className="w-4 h-4" />
                <span>まっさらに復旧</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
