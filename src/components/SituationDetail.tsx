import React, { useState } from 'react';
import { SituationInvestigation, TableEventItem } from '../types.ts';
import {
  X,
  Book,
  Bookmark,
  Edit3,
  Tag,
  User,
  ShieldAlert,
  Users,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Search,
  FileText,
  ClipboardCheck,
  ExternalLink,
} from 'lucide-react';

interface SituationDetailProps {
  situation: SituationInvestigation | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenEdit: () => void;
  isEditorAuthenticated: boolean;
  onTagClick?: (tag: string) => void;
}

export const SituationDetail: React.FC<SituationDetailProps> = ({
  situation,
  onClose,
  isFavorite,
  onToggleFavorite,
  onOpenEdit,
  isEditorAuthenticated,
  onTagClick,
}) => {
  const [selectedEventRoll, setSelectedEventRoll] = useState<number | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [lastCopiedKey, setLastCopiedKey] = useState<string | null>(null);

  if (!situation) return null;

  const copyText = (text: string, label: string, key?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (key) setLastCopiedKey(key);
    setCopyToast(`「${label}」をコピーしました`);
    setTimeout(() => {
      setCopyToast((prev) => (prev?.includes(label) ? null : prev));
      if (key) setLastCopiedKey(null);
    }, 2200);
  };

  // 処理の個別コピー
  const copyProcess = (processText: string, roll: number) => {
    if (!processText) return;
    copyText(processText, `出目${roll}の処理`, `proc-${roll}`);
  };

  // 再発生の個別コピー
  const copyRecurring = (recurringText: string, roll: number) => {
    if (!recurringText) return;
    copyText(recurringText, `出目${roll}の再発生`, `rec-${roll}`);
  };

  const getActorBadge = (actor: string) => {
    if (actor === '探偵だけ') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded bg-sky-100 text-sky-900 border border-sky-300 text-xs font-serif">
          <User className="w-3.5 h-3.5 mr-1 text-sky-700" />
          参加: 探偵のみ
        </span>
      );
    }
    if (actor === '助手だけ') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-serif">
          <User className="w-3.5 h-3.5 mr-1 text-emerald-700" />
          参加: 助手のみ
        </span>
      );
    }
    if (actor === 'NPCが登場する') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300 text-xs font-serif">
          <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-700" />
          参加: NPC関与
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded bg-stone-200 text-stone-900 border border-stone-300 text-xs font-serif">
        <Users className="w-3.5 h-3.5 mr-1 text-stone-700" />
        参加: 二人で捜査
      </span>
    );
  };

  const selectedEvent = situation.tableEvents?.find(
    (evt) => evt.roll === selectedEventRoll
  );

  return (
    <div
      id="situation-detail-overlay"
      className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex justify-center items-end md:items-center p-0 md:p-4 transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="situation-detail-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-3xl dossier-paper rounded-t-2xl md:rounded-xl shadow-2xl border-2 border-stone-800/80 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 relative"
      >
        {/* Toast notification when content copied */}
        {copyToast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-stone-950 text-amber-300 px-4 py-2 rounded-full shadow-lg border border-amber-600/60 flex items-center gap-2 text-xs font-serif animate-in fade-in slide-in-from-top-2 pointer-events-none">
            <ClipboardCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{copyToast}</span>
          </div>
        )}

        {/* Header Bar - Vintage Noir style */}
        <div className="bg-stone-900 text-stone-100 px-4 sm:px-5 py-3 flex items-center justify-between border-b-2 border-amber-900/60 shadow-xs select-none">
          <div className="flex items-center space-x-2.5 flex-wrap">
            <span className="stamp-box text-[11px] font-mono tracking-widest text-amber-400 border-amber-500/80 bg-stone-950/60">
              FILE RECORD
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-amber-300 border border-stone-700 font-serif">
              {situation.category}
            </span>
            <span className="text-xs text-stone-300 flex items-center font-serif hidden sm:flex flex-wrap gap-1">
              <span className="flex items-center">
                <Book className="w-3.5 h-3.5 mr-1 text-amber-400" />
                {situation.sourceBook}{' '}
                {situation.page && (
                  <span className="font-typewriter ml-1.5 text-amber-200 bg-stone-800 px-1.5 py-0.2 rounded border border-stone-700">
                    {situation.page}
                  </span>
                )}
              </span>
              {situation.sourceBook2 && (
                <span className="flex items-center text-amber-200/90 ml-1">
                  <span className="text-stone-500 mr-1.5">|</span>
                  <Book className="w-3.5 h-3.5 mr-1 text-amber-300" />
                  {situation.sourceBook2}{' '}
                  {situation.page2 && (
                    <span className="font-typewriter ml-1.5 text-amber-200 bg-stone-800 px-1.5 py-0.2 rounded border border-stone-700">
                      {situation.page2}
                    </span>
                  )}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              id="detail-fav-btn"
              onClick={onToggleFavorite}
              className={`p-2 rounded transition-colors ${
                isFavorite
                  ? 'text-amber-400 bg-stone-800 ring-1 ring-amber-500/50'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
              title={isFavorite ? '重要証拠マークを外す' : '重要証拠マーク（お気に入り）'}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {isEditorAuthenticated && (
              <button
                type="button"
                id="detail-edit-btn"
                onClick={onOpenEdit}
                className="p-2 rounded text-amber-300 hover:text-amber-200 hover:bg-stone-800 transition-colors flex items-center gap-1 text-xs"
                title="調書内容を編集する"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline font-serif">調書編集</span>
              </button>
            )}

            <button
              type="button"
              id="detail-close-btn"
              onClick={onClose}
              className="p-2 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors ml-1"
              title="調書を閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dossier Content Body */}
        <div className="overflow-y-auto p-5 md:p-7 space-y-6 text-stone-850">
          {/* Main Title & Stamp */}
          <div className="relative border-b-2 border-stone-300 pb-4 select-none">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-2">
              <div className="flex items-center flex-wrap gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-bold font-detective-title text-stone-950 tracking-wide">
                  {situation.name}
                </h2>

                {situation.abbreviation && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-serif font-bold bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                    <span className="text-[10px] text-amber-800/80 font-normal">略称:</span>
                    <span className="select-text">{situation.abbreviation}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyText(situation.abbreviation!, `略称「${situation.abbreviation}」`, 'abbr');
                      }}
                      className="ml-1 px-1.5 py-0.5 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 border border-amber-400/60 text-[10px] flex items-center gap-1 transition-colors cursor-pointer select-none"
                      title="略称をコピー"
                    >
                      {lastCopiedKey === 'abbr' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span className="text-emerald-800 font-bold">済</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-amber-800" />
                          <span>コピー</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* 汎用性バッジ */}
                {situation.versatility && (
                  <span
                    className={`text-xs px-2.5 py-1 rounded font-bold font-serif border flex items-center gap-1.5 ${
                      (situation.versatility as string) === 'あり' || (situation.versatility as string) === '高'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : (situation.versatility as string) === '条件付きあり' || (situation.versatility as string) === '中'
                        ? 'bg-sky-100 text-sky-900 border-sky-300'
                        : (situation.versatility as string) === '条件付きなし' || (situation.versatility as string) === '特殊'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-rose-100 text-rose-900 border-rose-300'
                    }`}
                  >
                    <span>汎用性: {situation.versatility}</span>
                  </span>
                )}
                {getActorBadge(situation.actorType)}
                <span className="text-xs text-stone-700 bg-stone-100/90 px-2 py-1 rounded border border-stone-200 flex items-center font-serif">
                  <Book className="w-3.5 h-3.5 mr-1 text-stone-500" />
                  <span>
                    {situation.sourceBook} {situation.page}
                  </span>
                  {situation.sourceBook2 && (
                    <span className="ml-2 pl-2 border-l border-stone-300">
                      {situation.sourceBook2} {situation.page2}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Confidential Stamp Graphic */}
            <div className="absolute right-0 top-0 pointer-events-none opacity-25 sm:opacity-35 rotate-[-8deg]">
              <span className="font-mono font-bold text-xs uppercase px-3 py-1 border-2 border-red-800 text-red-900 rounded tracking-widest">
                VERIFIED
              </span>
            </div>

            {/* コピー対象のご案内バー */}
            <div className="mt-3 px-3.5 py-2 bg-amber-50/90 rounded-lg border border-amber-200/90 text-[11px] text-amber-950 font-serif flex items-center justify-between gap-2 shadow-2xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                <span>
                  <strong>コピー可能項目:</strong> シチュエーション捜査では<strong>「略称」</strong>および展開表の<strong>「処理」</strong><strong>「再発生」</strong>を個別コピーできます。
                </span>
              </span>
              <span className="text-amber-800/80 hidden sm:inline text-[10px] shrink-0">
                ※概要・描写・タイトル等はコピー対象外
              </span>
            </div>

            {/* Summary Paper Note - 表示のみ（コピー不可） */}
            <div className="mt-3 p-3.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-stone-800 font-serif leading-relaxed shadow-2xs select-none">
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-amber-900/90 font-sans px-1.5 py-0.5 rounded bg-amber-200/60 border border-amber-300/80">
                    【シチュエーション概要】
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">表示専用</span>
              </div>
              <p className="text-sm md:text-base leading-relaxed">
                {situation.summary}
              </p>
            </div>
          </div>

          {/* Section: どんな状況で使うものなのか - 表示のみ（コピー不可） */}
          <div className="space-y-2 select-none">
            <div className="flex items-center justify-between pb-1 border-b border-amber-900/20">
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-widest flex items-center gap-1.5 font-serif">
                <Search className="w-4 h-4 text-amber-800" />
                どんな状況で使うものなのか（使用タイミング）
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">表示専用</span>
            </div>
            <div
              className="text-sm leading-relaxed text-stone-800 bg-white/90 p-4 rounded-md border border-stone-350 shadow-xs font-serif"
            >
              <span>{situation.usageTiming || '記載なし'}</span>
            </div>
          </div>

          {/* 1D6 展開・描写（出目1〜6の別窓を開くボタン） - 1回目の窓では表を置かず別窓で確認する構成 */}
          {situation.tableEvents && situation.tableEvents.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-stone-300 pb-1.5 flex-wrap gap-2 select-none">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-1.5 font-serif">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  1D6 展開・描写表（出目1〜6）
                </h3>
                <span className="text-[11px] text-stone-500 font-serif">
                  タップして各出目の詳細窓を表示
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {situation.tableEvents.map((evt) => (
                  <button
                    key={evt.roll}
                    type="button"
                    onClick={() => setSelectedEventRoll(evt.roll)}
                    className="flex flex-col items-center justify-between p-3.5 rounded-xl bg-white hover:bg-amber-100/90 active:bg-amber-200 border-2 border-stone-300 hover:border-amber-600 transition-all cursor-pointer group shadow-2xs text-center"
                    title={`出目${evt.roll}「${evt.title}」の詳細窓を開く`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1.5 w-full">
                      <span className="font-typewriter font-bold text-sm px-2.5 py-0.5 rounded-md bg-stone-900 text-amber-300 group-hover:bg-amber-900 group-hover:text-white shadow-2xs">
                        出目 {evt.roll}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700" />
                    </div>
                    <span className="text-xs font-bold text-stone-900 group-hover:text-amber-950 font-serif line-clamp-2 leading-tight">
                      {evt.title}
                    </span>
                    <span className="mt-2 text-[11px] text-amber-800 font-sans font-medium">
                      詳細窓を開く →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="pt-3 border-t border-stone-300 select-none">
            <h4 className="text-xs font-semibold text-stone-700 font-serif flex items-center mb-2">
              <Tag className="w-3.5 h-3.5 mr-1 text-stone-600" />
              分類タグ（クリックで絞り込み）
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(situation.tags || []).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (onTagClick) {
                      onTagClick(tag);
                      onClose();
                    }
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-stone-200/80 text-stone-800 hover:bg-stone-300 hover:text-stone-950 border border-stone-300 transition-colors font-serif"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-stone-100/90 border-t border-stone-300 px-5 py-2.5 flex items-center justify-between text-[11px] text-stone-500 font-serif shrink-0 select-none">
          <span>※シチュエーション捜査では「略称」「処理」「再発生」のみ個別コピーに対応しています。</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-stone-200 rounded text-xs transition-colors cursor-pointer"
          >
            調書を閉じる
          </button>
        </div>
      </div>

      {/* 窓の中に窓を開く: 1D6 出目詳細ポップアップ窓 (Nested Modal Window) */}
      {selectedEvent && (
        <div
          id="nested-event-modal-overlay"
          className="fixed inset-0 z-70 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedEventRoll(null)}
        >
          <div
            id="nested-event-modal"
            className="w-full max-w-2xl bg-[#FAF8F5] text-stone-900 rounded-2xl shadow-2xl border-2 border-stone-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-180"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 子窓ヘッダー */}
            <div className="p-4 sm:p-5 bg-stone-900 text-stone-100 border-b-2 border-amber-800/80 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-typewriter text-lg sm:text-xl font-bold bg-amber-400 text-stone-950 px-3 py-1 rounded-md shrink-0 shadow-xs">
                  出目 {selectedEvent.roll}
                </span>
                <div className="min-w-0">
                  <span className="text-[11px] text-amber-300 font-mono tracking-wider block font-bold">
                    1D6 展開詳細窓
                  </span>
                  <h4 className="text-base sm:text-lg font-bold font-detective-title text-white truncate">
                    {selectedEvent.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedEventRoll(null)}
                  className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                  title="窓を閉じる"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 出目切替クイックピル (窓を開いたまま 1〜6 を瞬時に切り替え可能) */}
            {situation.tableEvents && situation.tableEvents.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-850 border-b border-stone-700/80 overflow-x-auto select-none shrink-0">
                <span className="text-xs text-stone-300 font-serif font-bold shrink-0 mr-1">出目切替:</span>
                {situation.tableEvents.map((t) => (
                  <button
                    key={t.roll}
                    type="button"
                    onClick={() => setSelectedEventRoll(t.roll)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                      t.roll === selectedEvent.roll
                        ? 'bg-amber-400 text-stone-950 shadow-xs ring-2 ring-amber-400/50'
                        : 'bg-stone-700 text-stone-200 hover:bg-stone-600 hover:text-white'
                    }`}
                  >
                    出目 {t.roll}
                  </button>
                ))}
              </div>
            )}

            {/* 子窓本文 - 高コントラスト・大きな文字サイズで読みやすさを重視 */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-stone-900 font-serif bg-[#FAF8F5]">
              {/* コピー対象の補足案内 */}
              <div className="px-3.5 py-2 bg-amber-100/70 rounded-lg border border-amber-300 text-xs text-amber-950 font-serif flex items-center justify-between select-none">
                <span>※出目詳細では「●処理」および「●再発生」のみ個別コピーに対応しています。</span>
              </div>

              {/* ●概要 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs select-none">
                  <span className="font-bold text-stone-900 flex items-center gap-1.5 font-serif text-sm">
                    <Book className="w-4 h-4 text-amber-800" />
                    ●概要（状況の概略・目的）
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">表示専用</span>
                </div>
                <div className="text-sm sm:text-base text-stone-900 bg-white p-4 rounded-xl border border-stone-300 shadow-2xs leading-relaxed whitespace-pre-wrap select-none font-medium">
                  {selectedEvent.summary || '※概要テキストはありません'}
                </div>
              </div>

              {/* ●描写 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs select-none">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5 font-serif text-sm">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    ●描写（情景・導入演出）
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">表示専用</span>
                </div>
                <div className="text-sm sm:text-base text-stone-950 bg-amber-50/80 p-4 rounded-xl border-l-4 border-l-amber-600 border border-amber-200/90 shadow-2xs leading-relaxed whitespace-pre-wrap select-none font-serif">
                  {selectedEvent.description || '※描写テキストはありません'}
                </div>
              </div>

              {/* ●処理 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs select-none">
                  <span className="font-bold text-sky-950 flex items-center gap-1.5 font-serif text-sm">
                    <FileText className="w-4 h-4 text-sky-700" />
                    ●処理（判定技能・キーワード・効果）
                  </span>
                  {selectedEvent.process && (
                    <button
                      type="button"
                      onClick={() =>
                        copyProcess(
                          selectedEvent.process || '',
                          selectedEvent.roll
                        )
                      }
                      className="text-xs text-sky-950 hover:bg-sky-200 flex items-center gap-1 bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-300 font-bold transition-colors cursor-pointer select-none shadow-2xs"
                    >
                      {lastCopiedKey === `proc-${selectedEvent.roll}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>コピー完了</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-sky-700" />
                          <span>処理をコピー</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div
                  onClick={() => {
                    if (selectedEvent.process) {
                      copyProcess(selectedEvent.process, selectedEvent.roll);
                    }
                  }}
                  className="p-4 bg-sky-50/90 hover:bg-sky-100/90 rounded-xl border-2 border-sky-300 hover:border-sky-500 text-sm sm:text-base text-sky-950 font-medium leading-relaxed whitespace-pre-wrap cursor-pointer transition-colors shadow-2xs select-text"
                  title="クリックして処理内容をコピー"
                >
                  {selectedEvent.process || '※処理手順は登録されていません'}
                </div>
                <p className="text-[11px] text-sky-800/80 font-serif select-none">
                  ※枠内クリックまたは右上のボタンで処理テキストをコピーできます
                </p>
              </div>

              {/* ●再発生 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs select-none">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5 font-serif text-sm">
                    <Layers className="w-4 h-4 text-amber-700" />
                    ●再発生（2回目以降に出た場合の処理）
                  </span>
                  {selectedEvent.recurring && (
                    <button
                      type="button"
                      onClick={() =>
                        copyRecurring(
                          selectedEvent.recurring || '',
                          selectedEvent.roll
                        )
                      }
                      className="text-xs text-amber-950 hover:bg-amber-200 flex items-center gap-1 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 font-bold transition-colors cursor-pointer select-none shadow-2xs"
                    >
                      {lastCopiedKey === `rec-${selectedEvent.roll}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>コピー完了</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-700" />
                          <span>再発生をコピー</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div
                  onClick={() => {
                    if (selectedEvent.recurring) {
                      copyRecurring(selectedEvent.recurring, selectedEvent.roll);
                    }
                  }}
                  className="p-4 bg-amber-50/90 hover:bg-amber-100/90 rounded-xl border-2 border-amber-300 hover:border-amber-500 text-sm sm:text-base text-amber-950 font-medium leading-relaxed whitespace-pre-wrap cursor-pointer transition-colors shadow-2xs select-text"
                  title="クリックして再発生処理をコピー"
                >
                  {selectedEvent.recurring || '※再発生時の処理は登録されていません'}
                </div>
                <p className="text-[11px] text-amber-800/80 font-serif select-none">
                  ※枠内クリックまたは右上のボタンで再発生テキストをコピーできます
                </p>
              </div>
            </div>

            {/* 子窓フッター: 前後の出目切り替えボタン & 閉じる */}
            <div className="p-3.5 sm:p-4 bg-stone-100 border-t border-stone-300 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                disabled={selectedEvent.roll <= 1}
                onClick={() => setSelectedEventRoll(selectedEvent.roll - 1)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-serif font-bold flex items-center gap-1.5 transition-colors ${
                  selectedEvent.roll <= 1
                    ? 'text-stone-400 bg-stone-200/50 border border-stone-200 cursor-not-allowed'
                    : 'text-stone-800 bg-white hover:bg-stone-200 border border-stone-300 shadow-2xs cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>出目 {selectedEvent.roll - 1}へ</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEventRoll(null)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-lg text-xs sm:text-sm font-serif font-bold transition-colors cursor-pointer shadow-xs"
              >
                窓を閉じる
              </button>

              <button
                type="button"
                disabled={!situation.tableEvents || selectedEvent.roll >= situation.tableEvents.length}
                onClick={() => setSelectedEventRoll(selectedEvent.roll + 1)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-serif font-bold flex items-center gap-1.5 transition-colors ${
                  !situation.tableEvents || selectedEvent.roll >= situation.tableEvents.length
                    ? 'text-stone-400 bg-stone-200/50 border border-stone-200 cursor-not-allowed'
                    : 'text-stone-800 bg-white hover:bg-stone-200 border border-stone-300 shadow-2xs cursor-pointer'
                }`}
              >
                <span>出目 {selectedEvent.roll + 1}へ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
