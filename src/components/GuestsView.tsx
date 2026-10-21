import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  Tag,
  Shield,
  Sparkles,
  RotateCcw,
  BookOpen,
  LayoutGrid,
  FileText,
  TableProperties,
  ArrowRight,
  UserCheck,
  Users,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { GuestCharacter, GuestReactionItem } from '../types.ts';
import { EditGuestModal } from './EditGuestModal.tsx';
import { GuestDetailModal } from './GuestDetailModal.tsx';
import { SecretAvatar } from './SecretAvatar.tsx';

interface GuestsViewProps {
  guests: GuestCharacter[];
  onSaveGuest: (guest: GuestCharacter) => Promise<void>;
  onDeleteGuest: (guestId: string) => Promise<void>;
  onResetGuests: () => Promise<void>;
  isEditorAuthenticated: boolean;
  passkey: string;
  onOpenAuthModal: () => void;
}

export const GuestsView: React.FC<GuestsViewProps> = ({
  guests,
  onSaveGuest,
  onDeleteGuest,
  onResetGuests,
  isEditorAuthenticated,
  passkey,
  onOpenAuthModal
}) => {
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(() => {
    return guests.length > 0 ? guests[0].id : null;
  });
  // Default to 'cards' so users start by viewing the list, exactly like Situation Investigation
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'tabs'>('cards');
  const [detailGuestId, setDetailGuestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [editingGuest, setEditingGuest] = useState<GuestCharacter | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Available tags across all guests
  const allTags = useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      g.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [guests]);

  // Filtered guests list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      if (selectedTag !== 'all' && (!g.tags || !g.tags.includes(selectedTag))) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (g.name || '').toLowerCase().includes(q);
        const matchFurigana = g.furigana ? g.furigana.toLowerCase().includes(q) : false;
        const matchGender = g.gender ? g.gender.toLowerCase().includes(q) : false;
        const matchAge = g.age ? g.age.toLowerCase().includes(q) : false;
        const matchSummary = g.summary ? g.summary.toLowerCase().includes(q) : false;
        const matchProfile = g.profile ? g.profile.toLowerCase().includes(q) : false;
        const matchRelationship = g.relationship ? g.relationship.toLowerCase().includes(q) : false;
        const matchSkills = g.recommendedSkills ? g.recommendedSkills.toLowerCase().includes(q) : false;
        const matchClasses = g.candidateClasses ? g.candidateClasses.toLowerCase().includes(q) : false;
        const matchContent = g.content ? g.content.toLowerCase().includes(q) : false;
        const matchTags = g.tags ? g.tags.some((t) => t.toLowerCase().includes(q)) : false;
        if (
          !matchName &&
          !matchFurigana &&
          !matchGender &&
          !matchAge &&
          !matchSummary &&
          !matchProfile &&
          !matchRelationship &&
          !matchSkills &&
          !matchClasses &&
          !matchContent &&
          !matchTags
        ) {
          return false;
        }
      }
      return true;
    });
  }, [guests, selectedTag, searchQuery]);

  // Active selected guest (fallback to first filtered guest if current selection not found)
  const selectedGuest = useMemo(() => {
    if (selectedGuestId) {
      const found = guests.find((g) => g.id === selectedGuestId);
      if (found) return found;
    }
    return filteredGuests.length > 0 ? filteredGuests[0] : guests[0] || null;
  }, [guests, selectedGuestId, filteredGuests]);

  // Guest currently opened in detail modal (新枠)
  const activeDetailGuest = useMemo(() => {
    if (!detailGuestId) return null;
    return guests.find((g) => g.id === detailGuestId) || null;
  }, [guests, detailGuestId]);

  // 名前のみコピー
  const handleCopyGuestName = (guest: GuestCharacter, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(guest.name);
    setCopiedField(`name-${guest.id}`);
    setStatusMessage(`名前「${guest.name}」をコピーしました`);
    setTimeout(() => {
      setCopiedField(null);
      setStatusMessage(null);
    }, 2000);
  };

  // 推奨技能のみコピー
  const handleCopyRecommendedSkills = (guest: GuestCharacter, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!navigator.clipboard || !guest.recommendedSkills) return;
    navigator.clipboard.writeText(guest.recommendedSkills);
    setCopiedField(`skills-${guest.id}`);
    setStatusMessage(`推奨技能「${guest.recommendedSkills}」をコピーしました`);
    setTimeout(() => {
      setCopiedField(null);
      setStatusMessage(null);
    }, 2000);
  };

  // Delete guest confirmation
  const handleDelete = (guest: GuestCharacter) => {
    setConfirmDialog({
      title: 'ゲスト調書の削除',
      message: `ゲスト「${guest.name}」を完全に削除してもよろしいですか？`,
      confirmLabel: '削除する',
      isDanger: true,
      onConfirm: async () => {
        try {
          await onDeleteGuest(guest.id);
          setStatusMessage(`「${guest.name}」を削除しました`);
          setTimeout(() => setStatusMessage(null), 3000);
        } catch (err: any) {
          setStatusMessage(err.message || '削除に失敗しました');
          setTimeout(() => setStatusMessage(null), 3000);
        }
      }
    });
  };

  // Reset guests confirmation
  const handleReset = () => {
    setConfirmDialog({
      title: 'ゲストデータの初期化',
      message: 'すべてのゲストデータを初期状態にリセットしますか？（自身で追加・編集した内容は元に戻せません）',
      confirmLabel: '初期状態に復元',
      isDanger: true,
      onConfirm: async () => {
        try {
          await onResetGuests();
          setStatusMessage('ゲストデータを初期設定に戻しました');
          setTimeout(() => setStatusMessage(null), 3000);
        } catch (err: any) {
          setStatusMessage(err.message || '初期化に失敗しました');
          setTimeout(() => setStatusMessage(null), 3000);
        }
      }
    });
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Status Notice Toast */}
      {statusMessage && (
        <div className="p-3 bg-amber-950/80 border border-amber-700 text-amber-200 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-amber-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Control Bar */}
      <section className="bg-white rounded-xl shadow-xs border border-stone-200/90 p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-800 text-amber-100 flex items-center justify-center font-serif font-bold text-base shadow-xs">
              客
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 flex items-center gap-2">
                ゲスト調書（NPC一覧）
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-sans font-normal">
                  {guests.length}名 登録
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                『フタリソウサ』の依頼人・容疑者・協力者などのNPC情報と1D6リアクション表
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setEditingGuest(null);
                setIsEditModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>＋ ゲスト新規追加</span>
            </button>
          </div>
        </div>

        {/* Filter, Search & View Switcher Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前、概要、推奨技能、クラス候補、内容で検索..."
              className="w-full pl-9 pr-8 py-2 bg-stone-50 hover:bg-stone-50/80 focus:bg-white border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Switcher (Cards / Table / Tabs) */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-xs font-serif font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-amber-900 text-amber-100 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="カード一覧形式で表示（タップで新枠が開きます）"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>カード一覧</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-serif font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-900 text-amber-100 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="早見表形式で表示（タップで新枠が開きます）"
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>一覧表</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tabs')}
              className={`px-3 py-1.5 rounded-md text-xs font-serif font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'tabs'
                  ? 'bg-amber-900 text-amber-100 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="ページ内でタブを切り替えて個別表示"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>個別タブ表示</span>
            </button>
          </div>
        </div>

        {/* Tag Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-stone-100/80">
          <span className="text-xs font-bold text-stone-500 shrink-0 mr-1">タグ:</span>
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`px-2.5 py-1 rounded-md transition-colors shrink-0 cursor-pointer ${
              selectedTag === 'all'
                ? 'bg-stone-900 text-amber-200 font-bold shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            全員 ({guests.length})
          </button>
          {allTags.map((t) => {
            const count = guests.filter((g) => g.tags?.includes(t)).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTag(t)}
                className={`px-2.5 py-1 rounded-md transition-colors shrink-0 border cursor-pointer ${
                  selectedTag === t
                    ? 'bg-amber-900 text-amber-100 border-amber-700 font-bold shadow-2xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                #{t} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Guest Tab Navigation Bar (個別タブ表示時のみ表示) */}
      {viewMode === 'tabs' && (
        <section className="bg-white rounded-xl shadow-2xs border border-stone-200/90 p-2 sm:p-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {filteredGuests.length === 0 ? (
              <div className="text-xs text-stone-500 py-1.5 px-3">
                該当するゲストが見つかりません
              </div>
            ) : (
              filteredGuests.map((g) => {
                const isSelected = selectedGuest?.id === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setSelectedGuestId(g.id);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-serif font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-900 text-amber-100 border-amber-800 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {g.imageUrl && (
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-stone-800 border border-stone-300 shrink-0 flex items-center justify-center">
                        <img src={g.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span>{g.name}</span>
                  </button>
                );
              })
            )}

            {isEditorAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setEditingGuest(null);
                  setIsEditModalOpen(true);
                }}
                className="px-3 py-2 rounded-lg text-xs font-serif font-bold bg-amber-600/15 hover:bg-amber-600/25 text-amber-900 border border-amber-500/40 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>＋ 追加</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Main View Area based on viewMode */}
      {viewMode === 'tabs' ? (
        /* --- 1. Tab Dossier View (Individual Sheet) --- */
        selectedGuest ? (
          <div className="bg-white rounded-xl shadow-xs border border-stone-200/90 overflow-hidden">
            {/* Dossier Header */}
            <div className="bg-linear-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-100 p-4 sm:p-6 border-b border-stone-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  {/* Portrait Avatar (入力がある場合のみ表示) */}
                  {selectedGuest.imageUrl && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-stone-950 border-2 border-amber-700/80 shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={selectedGuest.imageUrl}
                        alt={selectedGuest.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-900 text-amber-200 border border-amber-700 font-serif font-bold">
                        ゲスト調書
                      </span>
                      {selectedGuest.tags && selectedGuest.tags.length > 0 && selectedGuest.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div>
                      {selectedGuest.furigana && (
                        <span className="text-xs text-amber-300/80 font-serif block tracking-wider mb-0.5">
                          {selectedGuest.furigana}
                        </span>
                      )}
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-100 tracking-wide">
                          {selectedGuest.name}
                        </h2>
                        {/* 性別・年齢・職業（入力されている場合のみ表示、未入力は非表示） */}
                        {(Boolean(selectedGuest.occupation?.trim()) || Boolean(selectedGuest.gender?.trim()) || Boolean(selectedGuest.age?.trim())) && (
                          <div className="flex items-center gap-1.5 text-xs font-serif flex-wrap">
                            {selectedGuest.occupation?.trim() && (
                              <span className="px-2.5 py-0.5 rounded bg-amber-900/90 text-amber-200 border border-amber-700/80 font-bold flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-amber-400" />
                                {selectedGuest.occupation.trim()}
                              </span>
                            )}
                            {selectedGuest.gender?.trim() && (
                              <span className="px-2 py-0.5 rounded bg-stone-850 text-amber-200 border border-stone-700/80 font-medium">
                                {selectedGuest.gender.trim()}
                              </span>
                            )}
                            {selectedGuest.age?.trim() && (
                              <span className="px-2 py-0.5 rounded bg-stone-850 text-amber-200 border border-stone-700/80 font-medium">
                                {selectedGuest.age.trim()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedGuest.summary && selectedGuest.summary.trim() && (
                      <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
                        {selectedGuest.summary}
                      </p>
                    )}

                    {/* 概要ヘッダー内の推奨クラス・クラス候補（全部表示） */}
                    {(Boolean(selectedGuest.recommendedClass?.trim()) || Boolean(selectedGuest.candidateClasses?.trim())) && (
                      <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                        {selectedGuest.recommendedClass?.trim() && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-600/80 text-amber-200 shadow-2xs">
                            <span className="font-bold text-amber-400">推奨クラス:</span>
                            <span className="font-serif font-bold text-amber-100">{selectedGuest.recommendedClass.trim()}</span>
                          </div>
                        )}
                        {selectedGuest.candidateClasses?.trim() && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-850 border border-stone-700 text-stone-200 shadow-2xs">
                            <span className="font-bold text-stone-400">クラス候補:</span>
                            <span className="font-serif font-medium text-stone-100">{selectedGuest.candidateClasses.trim()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Header */}
                <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                  <button
                    type="button"
                    onClick={() => setDetailGuestId(selectedGuest.id)}
                    title="調書を新枠（ポップアップ窓）で開く"
                    className="px-2.5 py-1.5 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-200 border border-amber-700/80 text-xs font-serif font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                    <span>新枠で開く</span>
                  </button>

                  {/* 名前コピーボタン */}
                  <button
                    type="button"
                    onClick={(e) => handleCopyGuestName(selectedGuest, e)}
                    title={`「${selectedGuest.name}」の名前をコピー`}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-serif flex items-center gap-1 transition-colors cursor-pointer select-none"
                  >
                    {copiedField === `name-${selectedGuest.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">名前済</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>名前コピー</span>
                      </>
                    )}
                  </button>

                  {/* 推奨技能コピーボタン */}
                  {selectedGuest.recommendedSkills && selectedGuest.recommendedSkills.trim() && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyRecommendedSkills(selectedGuest, e)}
                      title={`推奨技能「${selectedGuest.recommendedSkills}」をコピー`}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/70 text-xs font-serif flex items-center gap-1 transition-colors cursor-pointer select-none"
                    >
                      {copiedField === `skills-${selectedGuest.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">技能済</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-emerald-300" />
                          <span>技能コピー</span>
                        </>
                      )}
                    </button>
                  )}

                  {isEditorAuthenticated && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGuest(selectedGuest);
                          setIsEditModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                        title="このゲストを編集"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">編集</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedGuest)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-900/80 text-stone-400 hover:text-rose-200 border border-stone-700 text-xs transition-colors cursor-pointer"
                        title="このゲストを削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Dossier Body - 乗せるものだけ表示 */}
            {(() => {
              const hasRecClass = Boolean(selectedGuest.recommendedClass && selectedGuest.recommendedClass.trim());
              const hasClasses = Boolean(selectedGuest.candidateClasses && selectedGuest.candidateClasses.trim());
              const hasSkills = Boolean(selectedGuest.recommendedSkills && selectedGuest.recommendedSkills.trim());
              const hasProfile = Boolean(selectedGuest.profile && selectedGuest.profile.trim());
              const hasRelationship = Boolean(selectedGuest.relationship && selectedGuest.relationship.trim());
              const hasContent = Boolean(selectedGuest.content && selectedGuest.content.trim());
              const activeReactions = (selectedGuest.reactions || []).filter((r) => r.reaction && r.reaction.trim());
              const hasReactions = activeReactions.length > 0;
              const hasAnyField = hasRecClass || hasClasses || hasSkills || hasProfile || hasRelationship || hasContent || hasReactions;

              if (!hasAnyField) {
                return null;
              }

              return (
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Meta Grid: Recommended Class, Candidate Classes & Recommended Skills */}
                  {(hasRecClass || hasClasses || hasSkills) && (
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {hasRecClass && (
                        <div className="bg-amber-100/70 rounded-xl p-3.5 border border-amber-300 shadow-2xs">
                          <span className="text-[11px] font-bold text-amber-950 block mb-1">
                            ◆ 推奨クラス
                          </span>
                          <span className="text-sm font-bold text-amber-950 font-serif">
                            {selectedGuest.recommendedClass}
                          </span>
                        </div>
                      )}

                      {hasClasses && (
                        <div className="bg-amber-50/80 rounded-xl p-3.5 border border-amber-200/90 shadow-2xs">
                          <span className="text-[11px] font-bold text-amber-900 block mb-1">
                            ◆ クラス候補（全部表示）
                          </span>
                          <span className="text-sm font-bold text-stone-900 font-serif">
                            {selectedGuest.candidateClasses}
                          </span>
                        </div>
                      )}

                      {hasSkills && (
                        <div className="bg-emerald-50/70 rounded-xl p-3.5 border border-emerald-300 shadow-2xs flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-bold text-emerald-900 block mb-1 select-none">
                              ◆ 推奨技能
                            </span>
                            <span className="text-sm font-bold text-emerald-950 font-serif select-text">
                              {selectedGuest.recommendedSkills}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleCopyRecommendedSkills(selectedGuest, e)}
                            className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 text-[11px] font-serif flex items-center gap-1 transition-colors cursor-pointer shrink-0 select-none"
                            title={`推奨技能「${selectedGuest.recommendedSkills}」をコピー`}
                          >
                            {copiedField === `skills-${selectedGuest.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">技能済</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-emerald-700" />
                                <span>コピー</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Relationship Section (入力がある場合のみ表示) */}
                  {hasRelationship && (
                    <div className="space-y-1.5 bg-amber-50/70 p-4 rounded-xl border border-amber-200/90 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 font-serif border-b border-amber-200/80 pb-1.5">
                        <Users className="w-4 h-4 text-amber-700" />
                        <span>関係性（PC・他NPCとの関係・感情・因縁）</span>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-900 whitespace-pre-line leading-relaxed font-serif pt-1">
                        {selectedGuest.relationship}
                      </p>
                    </div>
                  )}

                  {/* Profile Section (入力がある場合のみ表示) */}
                  {hasProfile && (
                    <div className="space-y-1.5 bg-stone-50/60 p-4 rounded-xl border border-stone-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 font-serif border-b border-stone-200 pb-1.5">
                        <BookOpen className="w-4 h-4 text-amber-800" />
                        <span>プロフィール</span>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-800 whitespace-pre-line leading-relaxed font-serif pt-1">
                        {selectedGuest.profile}
                      </p>
                    </div>
                  )}

                  {/* Content Section (入力がある場合のみ表示) */}
                  {hasContent && (
                    <div className="rounded-xl border border-stone-250 bg-stone-50/80 p-4 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                        <BookOpen className="w-4 h-4 text-amber-900" />
                        <span className="text-xs font-serif font-bold text-stone-900">
                          内容
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-900 whitespace-pre-line leading-relaxed font-serif pt-1">
                        {selectedGuest.content}
                      </p>
                    </div>
                  )}

                  {/* 1D6 Reaction Table Section (入力がある場合のみ表示) */}
                  {hasReactions && (
                    <div className="bg-stone-900 text-stone-100 rounded-xl p-4 sm:p-5 border border-stone-800 shadow-md space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-amber-700 text-amber-100 flex items-center justify-center font-serif font-bold text-xs">
                            1D6
                          </div>
                          <div>
                            <h3 className="font-bold text-sm font-serif text-amber-200">
                              リアクション表（1D6）
                            </h3>
                            <p className="text-[11px] text-stone-400">
                              セッション中の接触や聞き込み時のリアクション
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-stone-400 font-mono">
                          {activeReactions.length}件登録
                        </span>
                      </div>

                      {/* Reaction Rows (入力がある出目のみ表示) */}
                      <div className="space-y-2">
                        {selectedGuest.reactions &&
                          selectedGuest.reactions.map((r) => {
                            if (!r.reaction || !r.reaction.trim()) return null;
                            return (
                              <div
                                key={r.roll}
                                className="p-3 rounded-lg border border-stone-800 bg-stone-850/90 text-stone-300 transition-colors flex items-start justify-between gap-3 select-none"
                              >
                                <div className="flex items-start gap-3.5 flex-1">
                                  <div className="w-9 h-9 rounded-lg bg-stone-800 text-amber-300 border border-stone-700 flex items-center justify-center font-serif font-bold text-base shrink-0 mt-0.5 shadow-2xs">
                                    {r.roll}
                                  </div>
                                  <div className="text-base sm:text-lg font-serif text-stone-100 leading-relaxed pt-0.5 whitespace-pre-line font-medium flex-1">
                                    {r.reaction}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200 text-stone-500 text-xs font-serif space-y-2">
            <p className="font-bold text-stone-700">ゲストが登録されていません</p>
            <p>「ゲストを新規追加」ボタンから登録してください。</p>
          </div>
        )
      ) : viewMode === 'cards' ? (
        /* --- 2. Card Grid View --- */
        filteredGuests.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-xl border border-stone-200 text-stone-600 text-xs font-serif space-y-3">
            <Users className="w-8 h-8 mx-auto text-amber-700/60" />
            <p className="text-sm text-stone-900 font-bold">
              {guests.length === 0
                ? 'ゲスト調書はまだ登録されていません（まっさらな状態です）'
                : '該当するゲストが見つかりません'}
            </p>
            <p className="text-stone-500 max-w-md mx-auto">
              {guests.length === 0
                ? '「＋ ゲスト新規追加」ボタンから依頼人・容疑者・協力者などのNPCを登録してください。'
                : '検索語句やタグの絞り込み条件を変更してお試しください。'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setEditingGuest(null);
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold rounded-lg text-xs font-serif flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>＋ ゲスト新規追加</span>
              </button>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuests.map((g) => {
            const isSelected = selectedGuest?.id === g.id;
            const hasRecClass = Boolean(g.recommendedClass && g.recommendedClass.trim());
            const hasSkills = Boolean(g.recommendedSkills && g.recommendedSkills.trim());
            const hasClasses = Boolean(g.candidateClasses && g.candidateClasses.trim());

            return (
              <div
                key={g.id}
                onClick={() => {
                  setSelectedGuestId(g.id);
                  setDetailGuestId(g.id);
                }}
                className={`bg-white rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 group ${
                  isSelected
                    ? 'border-amber-700 ring-2 ring-amber-600/30 shadow-md'
                    : 'border-stone-200/90 hover:border-amber-600/60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {g.imageUrl && (
                      <div className="w-14 h-14 rounded-xl bg-stone-900 border border-stone-300 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                        <img src={g.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap mb-1">
                        {g.tags && g.tags.length > 0 && g.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                      {g.furigana && (
                        <span className="text-[10px] text-amber-800/80 font-serif block truncate -mb-0.5">
                          {g.furigana}
                        </span>
                      )}
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <h3 className="font-bold font-serif text-stone-900 text-sm sm:text-base truncate group-hover:text-amber-900 transition-colors">
                          {g.name}
                        </h3>
                        {(Boolean(g.occupation?.trim()) || Boolean(g.gender?.trim()) || Boolean(g.age?.trim())) && (
                          <span className="text-[11px] text-amber-900/90 font-serif font-medium shrink-0">
                            ({[g.occupation?.trim(), g.gender?.trim(), g.age?.trim()].filter(Boolean).join('・')})
                          </span>
                        )}
                      </div>
                      {g.summary && g.summary.trim() && (
                        <p className="text-xs text-stone-500 line-clamp-2 mt-0.5 font-serif">
                          {g.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  {(hasRecClass || hasClasses || hasSkills) && (
                    <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
                      {hasRecClass && (
                        <div className="bg-amber-100/70 p-2 rounded-lg border border-amber-300/80">
                          <span className="font-bold text-amber-950 block text-[11px] mb-0.5">
                            ★ 推奨クラス:
                          </span>
                          <span className="font-serif font-bold text-amber-950 text-xs break-words">
                            {g.recommendedClass}
                          </span>
                        </div>
                      )}
                      {hasClasses && (
                        <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                          <span className="font-bold text-stone-700 block text-[11px] mb-0.5">
                            ◆ クラス候補（全表示）:
                          </span>
                          <span className="font-serif font-semibold text-stone-900 text-xs break-words leading-relaxed">
                            {g.candidateClasses}
                          </span>
                        </div>
                      )}
                      {hasSkills && (
                        <div className="flex items-start justify-between gap-1 text-stone-600 px-1">
                          <span className="font-bold text-stone-500 shrink-0">推奨技能:</span>
                          <span className="font-serif text-stone-800 text-right break-words flex-1">
                            {g.recommendedSkills}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {g.relationship && g.relationship.trim() && (
                    <div className="pt-2 border-t border-stone-100 text-xs">
                      <span className="font-bold text-amber-800 text-[11px] flex items-center gap-1">
                        <Users className="w-3 h-3 text-amber-700" />
                        関係性:
                      </span>
                      <p className="line-clamp-2 text-stone-600 font-serif text-[11px] mt-0.5 whitespace-pre-line">
                        {g.relationship}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-amber-900 group-hover:text-amber-700 font-serif font-bold transition-colors">
                  <span className="text-[11px] text-stone-400 group-hover:text-amber-850 font-normal">
                    タップして新枠で開く
                  </span>
                  <div className="flex items-center gap-1">
                    <span>調書を開く</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )
    ) : (
        /* --- 3. Table View --- */
        <div className="bg-white rounded-xl shadow-xs border border-stone-200 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/90 border-b border-stone-200 text-stone-700 font-serif">
                <th className="p-3 w-12 text-center">姿</th>
                <th className="p-3 min-w-[150px]">名前</th>
                <th className="p-3 min-w-[180px]">概要</th>
                <th className="p-3 min-w-[120px] text-amber-950 font-bold">推奨クラス</th>
                <th className="p-3 min-w-[140px]">クラス候補</th>
                <th className="p-3 min-w-[130px]">推奨技能</th>
                <th className="p-3 min-w-[160px]">関係性</th>
                <th className="p-3 min-w-[110px]">タグ</th>
                <th className="p-3 w-20 text-center">新枠</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/80 font-serif">
              {filteredGuests.map((g) => (
                <tr
                  key={g.id}
                  onClick={() => {
                    setSelectedGuestId(g.id);
                    setDetailGuestId(g.id);
                  }}
                  className="hover:bg-amber-50/60 cursor-pointer transition-colors"
                >
                  <td className="p-2 text-center">
                    {g.imageUrl ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-800 border border-stone-300 mx-auto flex items-center justify-center">
                        <img src={g.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-stone-300 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3 font-bold text-stone-900">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      {g.furigana ? (
                        <ruby className="inline-flex flex-col">
                          <span>{g.name}</span>
                          <rt className="text-[10px] font-normal text-amber-900/80 -mt-0.5">{g.furigana}</rt>
                        </ruby>
                      ) : (
                        <span>{g.name}</span>
                      )}
                      {(Boolean(g.occupation?.trim()) || Boolean(g.gender?.trim()) || Boolean(g.age?.trim())) && (
                        <span className="text-[11px] font-normal text-stone-500 font-serif">
                          ({[g.occupation?.trim(), g.gender?.trim(), g.age?.trim()].filter(Boolean).join('・')})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-stone-600 line-clamp-2 max-w-xs">{g.summary || '-'}</td>
                  <td className="p-3 font-bold text-amber-950">{g.recommendedClass || '-'}</td>
                  <td className="p-3 text-stone-900 break-words max-w-xs">{g.candidateClasses || '-'}</td>
                  <td className="p-3 text-stone-800">{g.recommendedSkills || '-'}</td>
                  <td className="p-3 text-stone-700 line-clamp-2 max-w-xs">{g.relationship || '-'}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {g.tags && g.tags.length > 0 ? (
                        g.tags.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px]"
                          >
                            #{t}
                          </span>
                        ))
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGuestId(g.id);
                        setDetailGuestId(g.id);
                      }}
                      className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-serif font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title={`${g.name}の調書を新枠で開く`}
                    >
                      <span>開く</span>
                      <ExternalLink className="w-3 h-3 text-amber-800" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Guest Modal */}
      <EditGuestModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGuest(null);
        }}
        guest={editingGuest}
        onSave={async (saved) => {
          await onSaveGuest(saved);
          setSelectedGuestId(saved.id);
          setIsEditModalOpen(false);
          setEditingGuest(null);
        }}
        passkey={passkey}
      />

      {/* Detail Slide/Modal Sheet (新枠表示) */}
      {activeDetailGuest && (
        <GuestDetailModal
          isOpen={Boolean(activeDetailGuest)}
          guest={activeDetailGuest}
          onClose={() => setDetailGuestId(null)}
          onEdit={(guest) => {
            setEditingGuest(guest);
            setIsEditModalOpen(true);
          }}
          onDelete={handleDelete}
          isAuthenticated={isEditorAuthenticated}
          allGuests={filteredGuests}
          onSelectGuest={(id) => {
            setSelectedGuestId(id);
            setDetailGuestId(id);
          }}
        />
      )}

      {/* Custom Confirmation Modal (Replaces window.confirm) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-serif animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-stone-200">
            <h3 className="text-base font-bold text-amber-200">
              {confirmDialog.title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 whitespace-pre-line leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-xs font-serif font-bold text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
                className={`px-4 py-2 text-xs font-serif font-bold rounded-lg transition-colors cursor-pointer ${
                  confirmDialog.isDanger
                    ? 'bg-rose-700 hover:bg-rose-600 text-rose-50 shadow-xs'
                    : 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-xs'
                }`}
              >
                {confirmDialog.confirmLabel || '実行する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
