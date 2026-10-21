import React, { useState } from 'react';
import { KeyRound, Check, X, ShieldAlert, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (passkey: string) => void;
  currentPasskey: string;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentPasskey,
  onLogout,
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tab for change passkey
  const [isChangingPasskey, setIsChangingPasskey] = useState(false);
  const [newPasskeyInput, setNewPasskeyInput] = useState('');

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkeyInput.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(passkeyInput.trim());
        onClose();
      } else {
        setErrorMsg(data.error || '合言葉が正しくありません');
      }
    } catch {
      setErrorMsg('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPasskey: currentPasskey,
          newPasskey: newPasskeyInput.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('合言葉を変更しました！');
        onSuccess(newPasskeyInput.trim());
        setTimeout(() => {
          setIsChangingPasskey(false);
          setSuccessMsg('');
        }, 1200);
      } else {
        setErrorMsg(data.error || '合言葉の変更に失敗しました');
      }
    } catch {
      setErrorMsg('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex justify-center items-center p-4"
    >
      <div
        id="auth-modal"
        className="w-full max-w-md bg-stone-50 rounded-xl shadow-2xl border border-stone-300 overflow-hidden text-stone-800"
      >
        <div className="bg-stone-900 text-stone-100 px-5 py-3.5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <h3 className="font-serif font-bold text-sm">
              {currentPasskey ? '編集者モード設定' : '編集者（管理人）認証'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center">
              <Check className="w-4 h-4 mr-1.5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {currentPasskey ? (
            // Already logged in
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                <p className="font-bold mb-1 flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-1" />
                  編集権限が有効になっています
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  現在、シチュエーションの追加・編集・描写の更新が可能です。
                </p>
              </div>

              {!isChangingPasskey ? (
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPasskey(true)}
                    className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium rounded transition-colors text-center"
                  >
                    合言葉（編集パスキー）を変更する
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="w-full py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium rounded transition-colors text-center"
                  >
                    編集者ログアウト（閲覧専用に戻る）
                  </button>
                </div>
              ) : (
                <form onSubmit={handleChangePasskey} className="space-y-3 pt-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      新しい合言葉（パスキー）
                    </label>
                    <input
                      type="password"
                      value={newPasskeyInput}
                      onChange={(e) => setNewPasskeyInput(e.target.value)}
                      placeholder="3文字以上の任意の文字列"
                      required
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsChangingPasskey(false)}
                      className="flex-1 py-1.5 bg-stone-200 text-stone-700 rounded"
                    >
                      戻る
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-1.5 bg-amber-800 text-white rounded font-medium disabled:opacity-50"
                    >
                      変更を保存
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            // Not logged in
            <form onSubmit={handleVerify} className="space-y-4 text-xs">
              <div className="text-stone-600 text-xs leading-relaxed space-y-1">
                <p>
                  特定の方（管理人やGMなど）だけがシチュエーションの描写や情報を更新できるように制限しています。
                </p>
                <div className="p-2 bg-stone-100 rounded text-[11px] text-stone-500">
                  ※ 初期設定の合言葉は <code className="bg-stone-200 px-1 py-0.5 rounded font-mono font-bold text-stone-800">futarisousa</code> に設定されています。
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  合言葉（編集パスキー）
                </label>
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="合言葉を入力"
                  autoFocus
                  required
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-stone-600 hover:text-stone-900 font-medium"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-medium rounded transition-colors disabled:opacity-50"
                >
                  {loading ? '確認中…' : '認証して編集モードへ'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
