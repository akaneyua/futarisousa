import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  CloudUpload,
  CloudDownload,
  Copy,
  Check,
  FileUp,
  Download,
  Database,
  CheckCircle2,
  X,
  RefreshCw,
  QrCode,
  ClipboardPaste,
  FileText
} from 'lucide-react';
import {
  AppDataBundle,
  SituationInvestigation,
  CharacterClass,
  CharacterSkill,
  GuestCharacter,
  SessionSummary,
  SessionNote
} from '../types.ts';
import { loadPersistentData, hasAnyData } from '../utils/persistentStorage.ts';

interface DataSyncAndBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  passkey: string;
  currentDataBundle: AppDataBundle;
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
  initialTab?: 'sync' | 'paste' | 'file';
}

export const DataSyncAndBackupModal: React.FC<DataSyncAndBackupModalProps> = ({
  isOpen,
  onClose,
  passkey,
  currentDataBundle,
  onImportSuccess,
  initialTab = 'sync'
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'paste' | 'file'>('sync');

  // QR Code state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Paste state
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  // File import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSyncStatus(null);
      setPasteError(null);
      setFileError(null);
      setPastedJsonText('');
      setSelectedFile(null);
      setParsedData(null);

      // Generate QR Code for current URL
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.href;
        QRCode.toDataURL(currentUrl, {
          width: 240,
          margin: 1.5,
          color: {
            dark: '#1c1917',
            light: '#fdfbf7'
          }
        })
          .then((url) => setQrCodeDataUrl(url))
          .catch((err) => console.error('Failed to generate QR Code:', err));
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Copy URL
  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2500);
      }
    } catch {}
  };

  // Copy full JSON bundle for LINE / Memo transfer
  const handleCopyJson = async () => {
    try {
      const json = JSON.stringify(currentDataBundle, null, 2);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(json);
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2500);
      }
    } catch {}
  };

  // Push current bundle to server (/api/backup/import)
  const handlePushToServer = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-edit-passkey': passkey || 'futarisousa'
        },
        body: JSON.stringify(currentDataBundle)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'サーバーへの同期に失敗しました');
      }
      setSyncStatus('サーバーへ正常に保存されました！ 他のスマホで再読込すると即座に反映されます。');
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err: any) {
      setSyncStatus(`エラー: ${err.message || '同期に失敗しました'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull latest from server and update client
  const handlePullFromServer = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const [
        resSituations,
        resClasses,
        resSkills,
        resAutoSkills,
        resGuests,
        resSummaries,
        resNotes
      ] = await Promise.all([
        fetch('/api/situations').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/classes').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/skills').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/auto-skills').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/guests').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/session-summaries').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/session-notes').then((r) => (r.ok ? r.json() : []))
      ]);

      onImportSuccess({
        situations: Array.isArray(resSituations) ? resSituations : [],
        characterClasses: Array.isArray(resClasses) ? resClasses : [],
        signatureSkills: Array.isArray(resSkills) ? resSkills : [],
        autoSkills: Array.isArray(resAutoSkills) ? resAutoSkills : [],
        guests: Array.isArray(resGuests) ? resGuests : [],
        sessionSummaries: Array.isArray(resSummaries) ? resSummaries : [],
        sessionNotes: Array.isArray(resNotes) ? resNotes : [],
        message: 'サーバーから最新データを取得しました'
      });

      setSyncStatus('サーバーから最新データを取得・反映しました！');
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: any) {
      setSyncStatus(`エラー: ${err.message || 'データ取得に失敗しました'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper to validate and parse backup payload
  const parseBackupJson = (text: string) => {
    const json = JSON.parse(text);
    let backup: any = {};
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

    if (
      sitCount === 0 &&
      clsCount === 0 &&
      skCount === 0 &&
      autoSkCount === 0 &&
      guestCount === 0 &&
      sumCount === 0 &&
      noteCount === 0
    ) {
      throw new Error(
        '復元可能なデータ（シチュエーション、クラス、アクション、ゲスト、進行サマリー、便利帳）が見つかりませんでした'
      );
    }
    return backup;
  };

  // Execute restore from parsed data
  const executeRestore = async (dataToRestore: any) => {
    setIsLoadingFile(true);
    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-edit-passkey': passkey || 'futarisousa'
        },
        body: JSON.stringify(dataToRestore)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
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
        message: resData.message || 'データが正常に同期・復元されました'
      });
      onClose();
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Handle pasted JSON restore
  const handleApplyPastedJson = async () => {
    if (!pastedJsonText.trim()) return;
    setPasteError(null);
    try {
      const parsed = parseBackupJson(pastedJsonText.trim());
      await executeRestore(parsed);
    } catch (err: any) {
      setPasteError(err.message || '貼り付けられたデータの解析に失敗しました');
    }
  };

  // File handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setFileError(null);
    setParsedData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const backup = parseBackupJson(text);
        setParsedData(backup);
      } catch (err: any) {
        setFileError(err.message || 'JSONファイルの解析に失敗しました');
      }
    };
    reader.onerror = () => {
      setFileError('ファイルの読み込みに失敗しました');
    };
    reader.readAsText(file);
  };

  // Load from IndexedDB
  const handleLoadFromBrowserStorage = async () => {
    try {
      const data = await loadPersistentData();
      if (!data || !hasAnyData(data)) {
        setFileError('ブラウザに保存された自動バックアップデータが見つかりませんでした');
        return;
      }
      setSelectedFile({ name: 'ブラウザ自動保存データ (IndexedDB/LocalStorage)' } as any);
      setParsedData(data);
      setFileError(null);
    } catch (err: any) {
      setFileError(err.message || 'ブラウザ保存データの読み込みに失敗しました');
    }
  };

  // Download JSON backup
  const handleDownloadBackup = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(currentDataBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `futarisousa-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-xl w-full my-auto shadow-2xl flex flex-col text-stone-200 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-700/80 border border-amber-600/50 flex items-center justify-center text-amber-200">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-amber-100 font-serif">
                スマホ・他端末とデータ共有
              </h2>
              <p className="text-xs text-stone-400 font-serif">
                PCで入力したデータをスマホや他プレイヤーと共有・同期します
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/70 text-xs font-serif font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sync'
                ? 'border-amber-500 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>📱 スマホ共有・即時同期</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'paste'
                ? 'border-amber-500 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>📋 テキスト貼付で復元</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'file'
                ? 'border-amber-500 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>💾 ファイル保存・読込</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* TAB 1: SMARTPHONE & SERVER SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* Notice Box */}
              {syncStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs font-serif flex items-start gap-2 ${
                    syncStatus.startsWith('エラー')
                      ? 'bg-rose-950/80 border-rose-700 text-rose-200'
                      : 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{syncStatus}</span>
                </div>
              )}

              {/* QR Code and Mobile Link Card */}
              <div className="bg-stone-850/90 border border-stone-750 p-4 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {qrCodeDataUrl ? (
                    <div className="p-2 bg-stone-100 rounded-xl shadow-md shrink-0">
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code"
                        className="w-36 h-36 object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 bg-stone-800 rounded-xl flex items-center justify-center text-xs text-stone-500 shrink-0">
                      QR生成中...
                    </div>
                  )}

                  <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 text-[11px] font-bold">
                      スマホで開く
                    </span>
                    <h3 className="font-bold text-sm text-stone-100 font-serif">
                      スマホのカメラでQRコードを読み取る
                    </h3>
                    <p className="text-xs text-stone-400 font-serif leading-relaxed">
                      この画面のQRコードをスマホのカメラで読み取ると、同じアプリ画面をそのまま開くことができます。
                    </p>

                    <div className="pt-1 flex items-center gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-stone-100 text-xs font-bold font-serif flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        {copiedUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>URLをコピーしました！</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>共有URLをコピー</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Server Sync Buttons */}
              <div className="bg-stone-850/80 border border-stone-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-amber-200 font-serif flex items-center gap-1.5">
                      <CloudUpload className="w-4 h-4 text-amber-400" />
                      <span>サーバーへの即時同期（アップロード）</span>
                    </h4>
                    <p className="text-[11px] text-stone-400 font-serif mt-0.5">
                      PCで入力した最新データをサーバーへ保存し、他の端末から参照可能にします
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePushToServer}
                    disabled={isSyncing}
                    className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-xs font-serif flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>今すぐサーバーへ保存</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-stone-200 font-serif flex items-center gap-1.5">
                      <CloudDownload className="w-4 h-4 text-stone-400" />
                      <span>サーバーから最新データを取得（ダウンロード）</span>
                    </h4>
                    <p className="text-[11px] text-stone-400 font-serif mt-0.5">
                      スマホ側で「データが古い／まっさら」なときに押すと、サーバーの保存データを即座に読み込みます
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePullFromServer}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 disabled:opacity-50 text-stone-200 border border-stone-700 font-medium text-xs font-serif flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>サーバーから再読込</span>
                  </button>
                </div>
              </div>

              {/* One-Tap JSON Copy for LINE/Memo transfer */}
              <div className="bg-stone-850/80 border border-stone-800 p-4 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-0.5 flex-1 min-w-[200px]">
                  <h4 className="font-bold text-xs sm:text-sm text-stone-200 font-serif flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>LINE・メモ帳で送る用のワンタップコピー</span>
                  </h4>
                  <p className="text-[11px] text-stone-400 font-serif">
                    現在の全データ（シチュエーション・NPC・サマリー・便利帳）をテキストとして一括コピーします。スマホに貼り付けるだけで復元できます。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-100 border border-stone-700 text-xs font-serif font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">コピー完了！</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>全データをコピー</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE TEXT RESTORE */}
          {activeTab === 'paste' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs font-serif text-amber-200 space-y-1">
                <p className="font-bold">📱 スマホ側でかんたん復元（ファイル選択不要）</p>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  PC側でコピーしたテキスト（またはLINEやメモに送ったテキスト）を、下の入力欄にそのままペースト（貼り付け）して「このデータで復元する」を押してください。
                </p>
              </div>

              {pasteError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs font-serif">
                  {pasteError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-300 font-serif">
                  バックアップテキストを貼り付け:
                </label>
                <textarea
                  rows={8}
                  value={pastedJsonText}
                  onChange={(e) => {
                    setPastedJsonText(e.target.value);
                    setPasteError(null);
                  }}
                  placeholder='{"situations": [...], "guests": [...], ...}'
                  className="w-full p-3 bg-stone-950 border border-stone-700 rounded-xl text-xs font-mono text-stone-200 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPastedJsonText('')}
                  disabled={!pastedJsonText.trim()}
                  className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-400 text-xs font-serif cursor-pointer disabled:opacity-40"
                >
                  クリア
                </button>
                <button
                  type="button"
                  onClick={handleApplyPastedJson}
                  disabled={!pastedJsonText.trim() || isLoadingFile}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold font-serif text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isLoadingFile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>復元中...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>このデータで復元する</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FILE DOWNLOAD & UPLOAD */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              {/* File Download Section */}
              <div className="p-4 bg-stone-850/80 border border-stone-800 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs sm:text-sm text-stone-100 font-serif flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>バックアップファイルの保存（PC向け）</span>
                  </h4>
                  <p className="text-[11px] text-stone-400 font-serif">
                    現在の全データをJSONファイルとして端末にダウンロード保存します。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-100 border border-stone-700 text-xs font-serif font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSONを保存</span>
                </button>
              </div>

              {/* File Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) processFile(f);
                }}
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
                  <div className="p-2.5 rounded-full bg-stone-800 text-amber-400">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-stone-200">
                    {selectedFile ? (
                      <span className="text-emerald-400 font-semibold">{selectedFile.name}</span>
                    ) : (
                      <span>ファイルを選択またはドラッグ＆ドロップ</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400">バックアップファイル (.json)</p>
                </div>
              </div>

              {/* IndexedDB quick load */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-850 border border-stone-750">
                <div className="flex items-center gap-2 min-w-0 mr-2">
                  <Database className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-200">
                      ブラウザの自動保存データから復元
                    </div>
                    <div className="text-[11px] text-stone-400 truncate">
                      端末（IndexedDB）に自動保存された最新作業データ
                    </div>
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

              {fileError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs font-serif">
                  {fileError}
                </div>
              )}

              {parsedData && (
                <div className="p-3.5 bg-stone-850 border border-emerald-600/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-300 font-bold font-serif">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ファイル検証完了
                    </span>
                    <button
                      type="button"
                      onClick={() => executeRestore(parsedData)}
                      disabled={isLoadingFile}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold font-serif cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isLoadingFile ? '復元中...' : 'このファイルを復元'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-stone-850 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 font-serif shrink-0">
          <div className="flex items-center gap-2">
            <span>現在のデータ: {currentDataBundle.situations?.length ?? 0}シチュエーション / {currentDataBundle.guests?.length ?? 0}ゲスト / {currentDataBundle.sessionNotes?.length ?? 0}便利帳</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-medium cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
