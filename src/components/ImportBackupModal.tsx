import React, { useState, useRef } from 'react';
import { Upload, FileUp, AlertTriangle, CheckCircle2, X, RefreshCw, KeyRound, Database } from 'lucide-react';
import { SituationInvestigation, CharacterClass, CharacterSkill, GuestCharacter, SessionSummary, SessionNote } from '../types.ts';
import { loadPersistentData, hasAnyData } from '../utils/persistentStorage.ts';

interface BackupPayload {
  exportedAt?: string;
  situations?: SituationInvestigation[];
  characterClasses?: CharacterClass[];
  signatureSkills?: CharacterSkill[];
  autoSkills?: CharacterSkill[];
  guests?: GuestCharacter[];
  sessionSummaries?: SessionSummary[];
  sessionNotes?: SessionNote[];
}

interface ImportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  passkey: string;
  onOpenAuthModal: () => void;
  onImportSuccess: (resultData: {
    situations: SituationInvestigation[];
    characterClasses: CharacterClass[];
    signatureSkills: CharacterSkill[];
    autoSkills: CharacterSkill[];
    guests?: GuestCharacter[];
    sessionSummaries?: SessionSummary[];
    sessionNotes?: SessionNote[];
    message: string;
  }) => void;
}

export const ImportBackupModal: React.FC<ImportBackupModalProps> = ({
  isOpen,
  onClose,
  passkey,
  onOpenAuthModal,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<BackupPayload | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tempPasskey, setTempPasskey] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentPasskey = passkey || tempPasskey;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleLoadFromBrowserStorage = async () => {
    try {
      const data = await loadPersistentData();
      if (!data || !hasAnyData(data)) {
        setParseError('ブラウザに保存された自動バックアップデータが見つかりませんでした');
        return;
      }
      setSelectedFile({ name: 'ブラウザ自動バックアップ (IndexedDB/LocalStorage)' } as any);
      setParsedData(data);
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || 'ブラウザ保存データの読み込みに失敗しました');
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setParseError(null);
    setParsedData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        // Check if it's an array of situations or a full backup object
        let backup: BackupPayload = {};
        if (Array.isArray(json)) {
          backup = { situations: json };
        } else if (typeof json === 'object' && json !== null) {
          backup = json;
        } else {
          throw new Error('JSONの形式が正しくありません');
        }

        const sitCount = backup.situations?.length ?? 0;
        const clsCount = backup.characterClasses?.length ?? 0;
        const skCount = backup.signatureSkills?.length ?? 0;
        const autoSkCount = backup.autoSkills?.length ?? 0;
        const guestCount = backup.guests?.length ?? 0;
        const sumCount = backup.sessionSummaries?.length ?? 0;
        const noteCount = backup.sessionNotes?.length ?? 0;

        if (sitCount === 0 && clsCount === 0 && skCount === 0 && autoSkCount === 0 && guestCount === 0 && sumCount === 0 && noteCount === 0) {
          throw new Error('復元可能なデータ（シチュエーション、クラス、アクション、ゲスト、サマリー、便利帳）が見つかりませんでした');
        }

        setParsedData(backup);
      } catch (err: any) {
        setParseError(err.message || 'JSONファイルの解析に失敗しました');
      }
    };
    reader.onerror = () => {
      setParseError('ファイルの読み込みに失敗しました');
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!parsedData) return;
    if (!currentPasskey) {
      setParseError('復元を実行するには編集合言葉が必要です');
      return;
    }

    setIsLoading(true);
    setParseError(null);

    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-edit-passkey': currentPasskey,
        },
        body: JSON.stringify(parsedData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '復元処理に失敗しました');
      }

      const resData = await res.json();
      onImportSuccess({
        situations: resData.data.situations,
        characterClasses: resData.data.characterClasses,
        signatureSkills: resData.data.signatureSkills,
        autoSkills: resData.data.autoSkills,
        guests: resData.data.guests,
        sessionSummaries: resData.data.sessionSummaries,
        sessionNotes: resData.data.sessionNotes,
        message: resData.message || 'バックアップから正常に復元されました',
      });
      handleClose();
    } catch (err: any) {
      setParseError(err.message || '通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParsedData(null);
    setParseError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-stone-200 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100 font-serif">バックアップから復元</h3>
              <p className="text-xs text-stone-400">保存したJSONファイルを読み込んで元の状態に戻します</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Dropzone / File Picker */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              selectedFile
                ? 'border-emerald-600/70 bg-emerald-950/20'
                : 'border-stone-700 hover:border-amber-600/80 bg-stone-850/60 hover:bg-stone-850'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 rounded-full bg-stone-800 text-amber-400">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-stone-200">
                {selectedFile ? (
                  <span className="text-emerald-400 font-semibold">{selectedFile.name}</span>
                ) : (
                  <span>クリックしてバックアップファイル (.json) を選択</span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                またはここにファイルをドラッグ＆ドロップしてください
              </p>
            </div>
          </div>

          {/* Quick Option: Load from Browser Local Backup */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-850 border border-stone-700/80">
            <div className="flex items-center gap-2 min-w-0 mr-2">
              <Database className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-200">ブラウザの自動保存データから復元</div>
                <div className="text-[11px] text-stone-400 truncate">端末（IndexedDB/LocalStorage）に自動保存された最新作業データ</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLoadFromBrowserStorage}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              自動保存を読込
            </button>
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Data Preview */}
          {parsedData && (
            <div className="bg-stone-850 border border-stone-700/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 border-b border-stone-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  読み込み可能なバックアップデータ
                </span>
                {parsedData.exportedAt && (
                  <span className="text-stone-400 font-normal">
                    保存日時: {new Date(parsedData.exportedAt).toLocaleString('ja-JP')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-stone-400">シチュエーション</div>
                  <div className="text-base font-bold text-amber-300">
                    {parsedData.situations?.length ?? 0} <span className="text-xs font-normal text-stone-400">件</span>
                  </div>
                </div>

                <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-stone-400">クラス調書</div>
                  <div className="text-base font-bold text-amber-300">
                    {parsedData.characterClasses?.length ?? 0} <span className="text-xs font-normal text-stone-400">種</span>
                  </div>
                </div>

                <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-stone-400">固有アクション</div>
                  <div className="text-base font-bold text-amber-300">
                    {parsedData.signatureSkills?.length ?? 0} <span className="text-xs font-normal text-stone-400">種</span>
                  </div>
                </div>

                <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-stone-400">自動取得アクション</div>
                  <div className="text-base font-bold text-sky-300">
                    {parsedData.autoSkills?.length ?? 0} <span className="text-xs font-normal text-stone-400">種</span>
                  </div>
                </div>

                <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-stone-400">ゲスト調書</div>
                  <div className="text-base font-bold text-amber-400">
                    {parsedData.guests?.length ?? 0} <span className="text-xs font-normal text-stone-400">名</span>
                  </div>
                </div>

                <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-stone-400">進行サマリー</div>
                  <div className="text-base font-bold text-emerald-400">
                    {parsedData.sessionSummaries?.length ?? 0} <span className="text-xs font-normal text-stone-400">件</span>
                  </div>
                </div>

                <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-stone-400">便利帳（用語・小ネタ）</div>
                  <div className="text-base font-bold text-amber-300">
                    {parsedData.sessionNotes?.length ?? 0} <span className="text-xs font-normal text-stone-400">件</span>
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200/90 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  復元を実行すると、現在の登録データが選択したファイルの内容ですべて上書きされます。
                </span>
              </div>
            </div>
          )}

          {/* Passkey authentication required for restoration */}
          {!passkey && (
            <div className="p-3.5 bg-stone-850 border border-stone-700/80 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                編集合言葉を入力してください（復元には権限が必要です）
              </label>
              <input
                type="password"
                value={tempPasskey}
                onChange={(e) => setTempPasskey(e.target.value)}
                placeholder="合言葉を入力 (初期値: futarisousa)"
                className="w-full p-2 bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-100 font-mono focus:outline-hidden focus:border-amber-600"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-850 border-t border-stone-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 text-xs font-medium border border-stone-700 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            id="execute-import-btn"
            onClick={handleExecuteImport}
            disabled={!parsedData || isLoading || !currentPasskey}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              parsedData && !isLoading && currentPasskey
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>復元中...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>このデータで復元を実行</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
