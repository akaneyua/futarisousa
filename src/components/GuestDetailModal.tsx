import React, { useState, useEffect } from 'react';
import { GuestCharacter, GuestReactionItem } from '../types.ts';
import {
  X,
  Copy,
  Check,
  Dices,
  Edit3,
  Trash2,
  Tag,
  Briefcase,
  Sparkles,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Shield,
  EyeOff
} from 'lucide-react';
import { SecretAvatar } from './SecretAvatar.tsx';

interface GuestDetailModalProps {
  isOpen: boolean;
  guest: GuestCharacter | null;
  onClose: () => void;
  onEdit?: (guest: GuestCharacter) => void;
  onDelete?: (guest: GuestCharacter) => void;
  isAuthenticated?: boolean;
  allGuests?: GuestCharacter[];
  onSelectGuest?: (guestId: string) => void;
}

export const GuestDetailModal: React.FC<GuestDetailModalProps> = ({
  isOpen,
  guest,
  onClose,
  onEdit,
  onDelete,
  isAuthenticated,
  allGuests = [],
  onSelectGuest,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [rolledDice, setRolledDice] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !guest) return null;

  const copyText = (text: string, label: string, key?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (key) setCopiedKey(key);
    setCopyToast(`「${label}」をコピーしました`);
    setTimeout(() => {
      setCopyToast((prev) => (prev?.includes(label) ? null : prev));
      if (key) setCopiedKey(null);
    }, 2200);
  };

  // Normalized active reactions list
  const activeReactions: GuestReactionItem[] = (
    guest.reactions && guest.reactions.length > 0
      ? guest.reactions
      : guest.reactionTable || []
  ).filter((r) => r && r.reaction && r.reaction.trim());

  // Roll 1D6 dice (表示のみ、自動コピーは行わない)
  const handleRollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    let counter = 0;
    const interval = setInterval(() => {
      setRolledDice(Math.floor(Math.random() * 6) + 1);
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setRolledDice(finalRoll);
        setIsRolling(false);
      }
    }, 60);
  };

  const handleDeleteConfirm = () => {
    if (!onDelete || !guest) return;
    onClose();
    onDelete(guest);
  };

  // Prev / Next guest navigation
  const currentIndex = allGuests.findIndex((g) => g.id === guest.id);
  const prevGuest = currentIndex > 0 ? allGuests[currentIndex - 1] : null;
  const nextGuest =
    currentIndex >= 0 && currentIndex < allGuests.length - 1
      ? allGuests[currentIndex + 1]
      : null;

  return (
    <div
      id="guest-detail-overlay"
      className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex justify-center items-end md:items-center p-0 md:p-4 transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="guest-detail-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-3xl dossier-paper rounded-t-2xl md:rounded-xl shadow-2xl border-2 border-stone-800/80 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 relative text-stone-850"
      >
        {/* Toast Notification when copied */}
        {copyToast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-stone-950 text-amber-300 px-4 py-2 rounded-full shadow-lg border border-amber-600/60 flex items-center gap-2 text-xs font-serif animate-in fade-in slide-in-from-top-2 pointer-events-none">
            <ClipboardCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{copyToast}</span>
          </div>
        )}

        {/* Vintage Noir Header Bar */}
        <div className="bg-stone-900 text-stone-100 px-4 sm:px-5 py-3 flex items-center justify-between border-b-2 border-amber-900/60 shadow-xs select-none">
          <div className="flex items-center space-x-2.5 flex-wrap">
            <span className="stamp-box text-[11px] font-mono tracking-widest text-amber-400 border-amber-500/80 bg-stone-950/60 px-2 py-0.5 border rounded">
              FILE RECORD
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-900 text-amber-200 border border-amber-700 font-serif">
              ゲスト調書
            </span>

            {/* Prev / Next Buttons in Header */}
            {allGuests.length > 1 && onSelectGuest && (
              <div className="hidden sm:flex items-center gap-1 ml-2 border-l border-stone-700/80 pl-2">
                <button
                  type="button"
                  disabled={!prevGuest}
                  onClick={() => prevGuest && onSelectGuest(prevGuest.id)}
                  className="p-1 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title={prevGuest ? `前のゲスト: ${prevGuest.name}` : undefined}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-serif text-stone-400 px-1">
                  {currentIndex + 1} / {allGuests.length}
                </span>
                <button
                  type="button"
                  disabled={!nextGuest}
                  onClick={() => nextGuest && onSelectGuest(nextGuest.id)}
                  className="p-1 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title={nextGuest ? `次のゲスト: ${nextGuest.name}` : undefined}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1.5">

            {/* Edit Button */}
            {isAuthenticated && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(guest);
                }}
                className="p-2 rounded text-amber-300 hover:text-amber-200 hover:bg-stone-800 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="ゲスト調書を編集する"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline font-serif">編集</span>
              </button>
            )}

            {/* Delete Button */}
            {isAuthenticated && onDelete && (
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="p-2 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="このゲストを削除する"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors ml-1 cursor-pointer"
              title="調書を閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dossier Content Body */}
        <div className="overflow-y-auto p-5 md:p-7 space-y-6 text-stone-850">
          {/* Main Title Section */}
          <div className="relative border-b-2 border-stone-300 pb-4 select-none">
            {/* コピー対象の案内バー */}
            <div className="mb-3 px-3.5 py-2 bg-amber-50/90 rounded-lg border border-amber-200/90 text-[11px] text-amber-950 font-serif flex items-center justify-between gap-2 shadow-2xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                <span>
                  <strong>コピー可能項目:</strong> ゲストNPCでは<strong>「名前」</strong>および<strong>「推奨技能」</strong>のみ個別コピーできます。
                </span>
              </span>
              <span className="text-amber-800/80 hidden sm:inline text-[10px] shrink-0">
                ※プロフィール・関係性・リアクション等はコピー対象外
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-2">
              <div>
                {guest.furigana && (
                  <span className="text-xs text-amber-900/80 font-serif block tracking-wider mb-0.5">
                    {guest.furigana}
                  </span>
                )}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-bold font-detective-title text-stone-950 tracking-wide select-text">
                    {guest.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => copyText(guest.name, 'ゲスト名', 'name')}
                    className="px-2 py-0.5 rounded bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-950 border border-stone-300 text-xs font-serif flex items-center gap-1 transition-colors cursor-pointer select-none"
                    title={`名前「${guest.name}」のみコピー`}
                  >
                    {copiedKey === 'name' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold text-[11px]">名前済</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                        <span className="text-[11px]">名前コピー</span>
                      </>
                    )}
                  </button>

                  {/* 性別・年齢・職業（入力されている場合のみ表示、未入力は非表示） */}
                  {(Boolean(guest.occupation?.trim()) || Boolean(guest.gender?.trim()) || Boolean(guest.age?.trim())) && (
                    <div className="flex items-center gap-1.5 text-xs font-serif flex-wrap">
                      {guest.occupation?.trim() && (
                        <span className="px-2.5 py-0.5 rounded bg-amber-900/90 text-amber-200 border border-amber-700/80 font-bold shadow-2xs flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-amber-400" />
                          <span>{guest.occupation.trim()}</span>
                        </span>
                      )}
                      {guest.gender?.trim() && (
                        <span className="px-2 py-0.5 rounded bg-stone-900 text-amber-200 border border-stone-700 font-medium shadow-2xs">
                          {guest.gender.trim()}
                        </span>
                      )}
                      {guest.age?.trim() && (
                        <span className="px-2 py-0.5 rounded bg-stone-900 text-amber-200 border border-stone-700 font-medium shadow-2xs">
                          {guest.age.trim()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags & Meta Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {guest.tags && guest.tags.length > 0 && guest.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-stone-200/90 text-stone-700 border border-stone-300 font-serif"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Confidential Stamp Graphic */}
            <div className="absolute right-0 top-0 pointer-events-none opacity-25 sm:opacity-35 rotate-[-8deg]">
              <span className="font-mono font-bold text-xs uppercase px-3 py-1 border-2 border-red-800 text-red-900 rounded tracking-widest">
                VERIFIED GUEST
              </span>
            </div>

            {/* Top Profile Card: Avatar + Key Metadata */}
            <div className="mt-3 flex flex-col sm:flex-row gap-4 items-start">
              {/* Portrait Image */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-stone-950 border-2 border-amber-900/60 shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                {guest.imageUrl ? (
                  <img
                    src={guest.imageUrl}
                    alt={guest.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <SecretAvatar size="lg" />
                )}
              </div>

              {/* Summary Note - 表示のみ（コピー不可） */}
              <div className="flex-1 min-w-0 space-y-2.5">
                {guest.summary && guest.summary.trim() ? (
                  <div
                    className="p-3 rounded-lg bg-amber-50/90 border border-amber-200/90 text-stone-850 font-serif leading-relaxed shadow-2xs select-none"
                  >
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                      <span className="text-[11px] font-semibold text-amber-900 font-sans px-1.5 py-0.2 rounded bg-amber-200/70 border border-amber-300">
                        【概要・立場】
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">表示専用</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {guest.summary}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-stone-100/70 border border-stone-200 text-stone-500 text-xs font-serif select-none">
                    概要の登録はありません
                  </div>
                )}

                {/* Recommended Class, Candidate Classes & Recommended Skills */}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {guest.recommendedClass && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/90 border border-amber-300 text-xs font-serif text-amber-950 shadow-2xs select-none">
                      <Briefcase className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                      <span className="text-amber-900 font-bold">推奨クラス:</span>
                      <span className="font-bold text-amber-950">{guest.recommendedClass}</span>
                    </div>
                  )}

                  {guest.candidateClasses && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-300 text-xs font-serif text-stone-800 shadow-2xs select-none">
                      <Briefcase className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      <span className="text-stone-500 font-medium">クラス候補:</span>
                      <span className="font-bold text-stone-900">{guest.candidateClasses}</span>
                    </div>
                  )}

                  {guest.recommendedSkills && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/50 border border-emerald-300 text-xs font-serif text-stone-800 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0 select-none" />
                      <span className="text-stone-600 font-medium select-none">推奨技能:</span>
                      <span className="font-bold text-emerald-950 select-text">{guest.recommendedSkills}</span>
                      <button
                        type="button"
                        onClick={() => copyText(guest.recommendedSkills!, '推奨技能', 'skills')}
                        className="ml-1 px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 text-[10px] font-serif flex items-center gap-1 transition-colors cursor-pointer select-none"
                        title={`推奨技能「${guest.recommendedSkills}」のみコピー`}
                      >
                        {copiedKey === 'skills' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">技能済</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-emerald-700" />
                            <span>技能コピー</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {guest.sourceBook && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-stone-300 text-xs font-serif text-stone-600 shadow-2xs select-none">
                      <BookOpen className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span>{guest.sourceBook}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: 関係性 (入力がある場合のみ表示) - 表示のみ（コピー不可） */}
          {guest.relationship && guest.relationship.trim() && (
            <div className="space-y-2 select-none">
              <div className="flex items-center justify-between pb-1 border-b border-amber-900/20">
                <h3 className="text-xs font-bold text-amber-950 uppercase tracking-widest flex items-center gap-1.5 font-serif">
                  <Users className="w-4 h-4 text-amber-800" />
                  関係性（PC・他NPCとの関係・感情・因縁）
                </h3>
                <span className="text-[10px] text-stone-400 font-mono">表示専用</span>
              </div>
              <div
                className="text-xs sm:text-sm leading-relaxed text-stone-850 bg-amber-50/70 p-4 rounded-xl border border-amber-200/90 shadow-2xs font-serif"
              >
                <p className="whitespace-pre-line leading-relaxed flex-1">
                  {guest.relationship}
                </p>
              </div>
            </div>
          )}

          {/* Section: プロフィール (入力がある場合のみ表示) - 表示のみ（コピー不可） */}
          {guest.profile && guest.profile.trim() && (
            <div className="space-y-2 select-none">
              <div className="flex items-center justify-between pb-1 border-b border-stone-300">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-1.5 font-serif">
                  <BookOpen className="w-4 h-4 text-amber-800" />
                  プロフィール
                </h3>
                <span className="text-[10px] text-stone-400 font-mono">表示専用</span>
              </div>
              <div
                className="text-xs sm:text-sm leading-relaxed text-stone-850 bg-stone-50/80 p-4 rounded-xl border border-stone-250 shadow-2xs font-serif"
              >
                <p className="whitespace-pre-line leading-relaxed flex-1">
                  {guest.profile}
                </p>
              </div>
            </div>
          )}

          {/* Section: 内容 (入力がある場合のみ表示) - 表示のみ（コピー不可） */}
          {guest.content && guest.content.trim() && (
            <div className="space-y-2 select-none">
              <div className="flex items-center justify-between pb-1 border-b border-stone-300">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-1.5 font-serif">
                  <Shield className="w-4 h-4 text-amber-900" />
                  内容（真相・GM情報・セッション運用）
                </h3>
                <span className="text-[10px] text-stone-400 font-mono">表示専用</span>
              </div>
              <div
                className="text-xs sm:text-sm leading-relaxed text-stone-850 bg-stone-50/80 p-4 rounded-xl border border-stone-250 shadow-2xs font-serif"
              >
                <p className="whitespace-pre-line leading-relaxed flex-1">
                  {guest.content}
                </p>
              </div>
            </div>
          )}

          {/* Section: 1D6 リアクション表 - ダイス判定・表示専用（コピー不可） */}
          {activeReactions.length > 0 && (
            <div className="bg-stone-900 text-stone-100 rounded-xl p-4 sm:p-5 border border-stone-800 shadow-md space-y-4 select-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-700 text-amber-100 flex items-center justify-center font-serif font-bold text-xs shadow-xs">
                    1D6
                  </div>
                  <div>
                    <h3 className="font-bold text-sm font-serif text-amber-200">
                      リアクション表（1D6）
                    </h3>
                    <p className="text-[11px] text-stone-400 font-serif">
                      セッション中の接触や聞き込み時のリアクション（出目判定用）
                    </p>
                  </div>
                </div>

                {/* 1D6 Dice Button */}
                <button
                  type="button"
                  onClick={handleRollDice}
                  disabled={isRolling}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-xs flex items-center gap-2 shadow-md transition-all self-start active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
                  <span>
                    {isRolling
                      ? 'ダイス中...'
                      : rolledDice
                      ? `1D6を振り直す (出目: ${rolledDice})`
                      : '1D6を振る'}
                  </span>
                </button>
              </div>

              {/* Reaction Rows */}
              <div className="space-y-2">
                {activeReactions.map((r) => {
                  const isHighlighted = rolledDice === r.roll;

                  return (
                    <div
                      key={r.roll}
                      className={`p-3 rounded-lg border transition-all flex items-start gap-3 relative ${
                        isHighlighted
                          ? 'bg-amber-950/70 border-amber-500 ring-2 ring-amber-500/50 shadow-lg'
                          : 'bg-stone-850/90 border-stone-800'
                      }`}
                    >
                      {/* Roll Badge */}
                      <div className="shrink-0 pt-0.5">
                        <span
                          className={`w-9 h-9 rounded-lg text-base font-serif font-bold flex items-center justify-center border shadow-xs transition-all ${
                            isHighlighted
                              ? 'bg-amber-500 text-stone-950 border-amber-300 font-black scale-110'
                              : 'bg-stone-950 text-amber-200 border-amber-800/80'
                          }`}
                        >
                          {r.roll}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-base sm:text-lg font-serif font-bold text-amber-200 truncate">
                            {r.title || `出目 ${r.roll}`}
                          </h4>
                          {isHighlighted && (
                            <span className="text-xs sm:text-sm text-amber-300 font-serif font-bold">
                              ★ 判定結果
                            </span>
                          )}
                        </div>
                        <p className="text-base sm:text-lg text-stone-100 leading-relaxed font-serif whitespace-pre-line font-medium">
                          {r.reaction}
                        </p>
                        {r.effect && (
                          <div className="pt-1.5 flex items-center gap-2 text-sm sm:text-base text-amber-300 font-serif">
                            <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800/80 text-xs font-bold text-amber-400">
                              効果
                            </span>
                            <span>{r.effect}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="px-5 py-3 border-t border-stone-300 bg-stone-100/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-serif text-stone-600 select-none">
          <div className="flex items-center gap-3">
            <span>※ゲストNPCは「名前」と「推奨技能」のみ個別コピーに対応しています</span>
          </div>

          <div className="flex items-center gap-2">
            {allGuests.length > 1 && onSelectGuest && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  type="button"
                  disabled={!prevGuest}
                  onClick={() => prevGuest && onSelectGuest(prevGuest.id)}
                  className="px-2.5 py-1 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>前へ</span>
                </button>
                <button
                  type="button"
                  disabled={!nextGuest}
                  onClick={() => nextGuest && onSelectGuest(nextGuest.id)}
                  className="px-2.5 py-1 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>次へ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold transition-colors cursor-pointer"
            >
              調書を閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
