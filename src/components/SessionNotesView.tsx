import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Tag,
  Bookmark,
  Edit,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Filter,
  X,
  KeyRound,
  FileText,
  HelpCircle,
  Hash,
  ExternalLink,
  Sliders,
  Edit2,
  Image as ImageIcon,
  ZoomIn,
  ArrowUpDown
} from 'lucide-react';
import { SessionNote, SessionNoteCategory } from '../types.ts';
import { EditSessionNoteModal } from './EditSessionNoteModal.tsx';
import { FormattedNoteContent, ImageLightboxModal, LightboxImage } from './FormattedNoteContent.tsx';
import { ManageSessionNoteTagsModal } from './ManageSessionNoteTagsModal.tsx';

interface SessionNotesViewProps {
  notes: SessionNote[];
  onSaveNote: (note: SessionNote) => Promise<void>;
  onBatchUpdateNotes?: (updatedNotes: SessionNote[]) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onResetNotes?: () => Promise<void>;
  isEditorAuthenticated: boolean;
  passkey: string;
  onOpenAuthModal: () => void;
}

const CATEGORY_COLORS: Record<
  SessionNoteCategory,
  { bg: string; text: string; border: string; badge: string }
> = {
  用語: {
    bg: 'bg-amber-50/60',
    text: 'text-amber-900',
    border: 'border-amber-300/80',
    badge: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  キャラ作成: {
    bg: 'bg-emerald-50/60',
    text: 'text-emerald-900',
    border: 'border-emerald-300/80',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300'
  },
  小ネタ: {
    bg: 'bg-purple-50/60',
    text: 'text-purple-900',
    border: 'border-purple-300/80',
    badge: 'bg-purple-100 text-purple-900 border-purple-300'
  },
  '判定・ルール': {
    bg: 'bg-sky-50/60',
    text: 'text-sky-900',
    border: 'border-sky-300/80',
    badge: 'bg-sky-100 text-sky-900 border-sky-300'
  },
  その他: {
    bg: 'bg-stone-100/60',
    text: 'text-stone-800',
    border: 'border-stone-300/80',
    badge: 'bg-stone-200 text-stone-800 border-stone-300'
  }
};

export const SessionNotesView: React.FC<SessionNotesViewProps> = ({
  notes,
  onSaveNote,
  onBatchUpdateNotes,
  onDeleteNote,
  onResetNotes,
  isEditorAuthenticated,
  passkey,
  onOpenAuthModal
}) => {
  // Modal state
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [quickTagNote, setQuickTagNote] = useState<SessionNote | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL'); // 'ALL' | SessionNoteCategory | 'PINNED'
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'oldestFirst' | 'newestFirst'>('oldestFirst');
  const [filterHasImageOnly, setFilterHasImageOnly] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Tag display quantity controls
  const [tagDisplayLimit, setTagDisplayLimit] = useState<number>(15);
  const [showAllTags, setShowAllTags] = useState(false);

  // Notes with image count
  const notesWithImagesCount = useMemo(() => {
    return notes.filter((n) =>
      Boolean(
        (Array.isArray(n.imageUrls) && n.imageUrls.length > 0) ||
        n.imageUrl ||
        n.description.includes('![')
      )
    ).length;
  }, [notes]);

  // Calculate unique tags with counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  // Displayed tags according to limit
  const displayedTags = useMemo(() => {
    if (showAllTags || tagDisplayLimit >= tagCounts.length) {
      return tagCounts;
    }
    return tagCounts.slice(0, tagDisplayLimit);
  }, [tagCounts, showAllTags, tagDisplayLimit]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: notes.length, PINNED: 0 };
    notes.forEach((n) => {
      counts[n.category] = (counts[n.category] || 0) + 1;
      if (n.isPinned) counts.PINNED = (counts.PINNED || 0) + 1;
    });
    return counts;
  }, [notes]);

  // Filtered and sorted notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Image filter
        if (filterHasImageOnly) {
          const hasImage = Boolean(
            (Array.isArray(note.imageUrls) && note.imageUrls.length > 0) ||
            note.imageUrl ||
            note.description.includes('![')
          );
          if (!hasImage) return false;
        }

        // Category filter
        if (selectedCategory === 'PINNED') {
          if (!note.isPinned) return false;
        } else if (selectedCategory !== 'ALL') {
          if (note.category !== selectedCategory) return false;
        }

        // Tag filter (must contain all selected tags)
        if (selectedTags.length > 0) {
          const noteTags = note.tags || [];
          const hasAll = selectedTags.every((t) => noteTags.includes(t));
          if (!hasAll) return false;
        }

        // Search query (title, description, tags, source)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (note.title || '').toLowerCase().includes(q);
          const matchDesc = (note.description || '').toLowerCase().includes(q);
          const matchSource = note.sourceBook ? note.sourceBook.toLowerCase().includes(q) : false;
          const matchTags = (note.tags || []).some((t) => (t || '').toLowerCase().includes(q));

          if (!matchTitle && !matchDesc && !matchSource && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned notes come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (sortOrder === 'oldestFirst') {
          // 登録順（登録したものが下にくる・古い順が上）
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
          if (timeA && timeB && timeA !== timeB) {
            return timeA - timeB;
          }
          return 0;
        } else {
          // 新着順（登録したものが上にくる）
          const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          if (timeA && timeB && timeA !== timeB) {
            return timeB - timeA;
          }
          return 0;
        }
      });
  }, [notes, selectedCategory, selectedTags, searchQuery, filterHasImageOnly, sortOrder]);

  // Tag click handler
  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Toggle pin
  const handleTogglePin = async (note: SessionNote) => {
    if (!isEditorAuthenticated) {
      onOpenAuthModal();
      return;
    }
    await onSaveNote({
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString()
    });
  };

  // Batch update handler fallback
  const handleBatchUpdate = async (updatedNotes: SessionNote[]) => {
    if (onBatchUpdateNotes) {
      await onBatchUpdateNotes(updatedNotes);
    } else {
      for (const un of updatedNotes) {
        await onSaveNote(un);
      }
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in select-none">
      {statusToast && (
        <div className="p-3 bg-amber-950/80 border border-amber-600 text-amber-200 text-xs rounded-xl flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-bold">{statusToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusToast(null)}
            className="text-amber-400 hover:text-white px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-stone-900 text-stone-100 border border-amber-900/60 rounded-xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-700/60 text-[11px] font-serif">
                セッション便利帳
              </span>
              <span className="text-xs text-stone-400">
                用語・キャラ作成サマリー・セッション小ネタ・判定ルール
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-detective-title text-amber-100">
              セッション便利帳（用語・小ネタ）
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-3xl leading-relaxed">
              『フタリソウサ』のセッション進行やキャラ作成中にサッと参照できる重要用語、作成ステップ、掛け合いフレーズ、ココフォリア用チャットパレットなどを整理したナレッジ集です。
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              id="manage-session-note-tags-btn"
              onClick={() => setIsTagManagerOpen(true)}
              className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700 text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              title="タグの名前変更・一括削除・表示数の設定を行う"
            >
              <Tag className="w-4 h-4 text-amber-400" />
              <span>タグの管理・編集</span>
            </button>

            <button
              type="button"
              id="add-session-note-btn"
              onClick={() => {
                setEditingNote(null);
                setIsModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>＋ 項目を追加</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
        {/* Row 1: Search input & Active count */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="題名、説明、タグ、ルールブック出典から検索...（太字テキストも検索対象）"
              className="w-full pl-9 pr-9 py-2 bg-stone-950/80 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-stone-400 flex items-center justify-between sm:justify-end gap-2 px-1 flex-wrap">
            <span>
              該当: <strong className="text-amber-300 font-bold">{filteredNotes.length}</strong> / {notes.length}件
            </span>

            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'oldestFirst' ? 'newestFirst' : 'oldestFirst'))}
              className="px-2.5 py-1 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-stone-750 text-xs font-serif flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="並び順を切り替え（登録順：新着が下 / 新着順：新着が上）"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>{sortOrder === 'oldestFirst' ? '登録順 (新着が下)' : '新着順 (新着が上)'}</span>
            </button>

            {(searchQuery || selectedCategory !== 'ALL' || selectedTags.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedTags([]);
                }}
                className="text-amber-400 hover:text-amber-300 text-xs underline underline-offset-2 flex items-center gap-0.5 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>条件クリア</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-800">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-amber-800 text-amber-100 font-bold border border-amber-600'
                : 'bg-stone-850 text-stone-300 hover:bg-stone-800 border border-stone-750'
            }`}
          >
            <span>すべて</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-900/60 text-[10px] text-stone-300">
              {categoryCounts.ALL || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('用語')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === '用語'
                ? 'bg-amber-800 text-amber-100 font-bold border border-amber-600'
                : 'bg-stone-850 text-stone-300 hover:bg-stone-800 border border-stone-750'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>用語</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-900/60 text-[10px] text-stone-300">
              {categoryCounts['用語'] || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('キャラ作成')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'キャラ作成'
                ? 'bg-emerald-900 text-emerald-100 font-bold border border-emerald-600'
                : 'bg-stone-850 text-stone-300 hover:bg-stone-800 border border-stone-750'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>キャラ作成</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-900/60 text-[10px] text-stone-300">
              {categoryCounts['キャラ作成'] || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('小ネタ')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === '小ネタ'
                ? 'bg-purple-900 text-purple-100 font-bold border border-purple-600'
                : 'bg-stone-850 text-stone-300 hover:bg-stone-800 border border-stone-750'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>小ネタ・Tips</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-900/60 text-[10px] text-stone-300">
              {categoryCounts['小ネタ'] || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('判定・ルール')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === '判定・ルール'
                ? 'bg-sky-900 text-sky-100 font-bold border border-sky-600'
                : 'bg-stone-850 text-stone-300 hover:bg-stone-800 border border-stone-750'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>判定・ルール</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-900/60 text-[10px] text-stone-300">
              {categoryCounts['判定・ルール'] || 0}
            </span>
          </button>

          {categoryCounts.PINNED > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCategory('PINNED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'PINNED'
                  ? 'bg-amber-900 text-amber-200 font-bold border border-amber-600'
                  : 'bg-stone-850 text-stone-300 hover:bg-stone-800 border border-stone-750'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>ピン留め</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-900/60 text-[10px] text-stone-300">
                {categoryCounts.PINNED}
              </span>
            </button>
          )}

          {notesWithImagesCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterHasImageOnly(!filterHasImageOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                filterHasImageOnly
                  ? 'bg-amber-800 text-amber-100 font-bold border border-amber-600 shadow-xs'
                  : 'bg-stone-850 text-stone-300 hover:bg-stone-800 border border-stone-750'
              }`}
              title="画像付き項目のみ絞り込み"
            >
              <ImageIcon className={`w-3.5 h-3.5 ${filterHasImageOnly ? 'text-amber-300' : 'text-amber-400'}`} />
              <span>画像あり</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-900/60 text-[10px] text-stone-300">
                {notesWithImagesCount}
              </span>
            </button>
          )}
        </div>

        {/* Row 3: Tag Cloud with Amount Control & Edit Tag Entrypoint */}
        {tagCounts.length > 0 && (
          <div className="pt-2 border-t border-stone-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Tag Chips List */}
              <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                <span className="text-stone-400 flex items-center gap-1 text-[11px] font-medium mr-1 shrink-0">
                  <Tag className="w-3 h-3 text-amber-400" />
                  <span>タグで絞り込み:</span>
                </span>

                {displayedTags.map(([tag, count]) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-700 text-stone-950 font-bold border border-amber-500 shadow-2xs'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-750 hover:text-stone-100 border border-stone-700'
                      }`}
                    >
                      <span>#{tag}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-stone-900 font-bold' : 'text-stone-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}

                {/* Toggle Show More/Less if total tags exceed limit */}
                {tagCounts.length > tagDisplayLimit && (
                  <button
                    type="button"
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="px-2 py-0.5 rounded bg-stone-850 hover:bg-stone-800 text-amber-300 border border-stone-700 text-xs cursor-pointer flex items-center gap-1 font-serif"
                    title={showAllTags ? 'タグの表示数をコンパクトにする' : 'すべてのタグを展開表示'}
                  >
                    <span>{showAllTags ? '閉じる' : `他 ${tagCounts.length - tagDisplayLimit}件...`}</span>
                  </button>
                )}

                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="px-2 py-0.5 text-[11px] text-rose-300 hover:text-rose-100 underline decoration-dotted ml-1 cursor-pointer"
                  >
                    タグ解除
                  </button>
                )}
              </div>

              {/* Tag Quantity & Management Action Button */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsTagManagerOpen(true)}
                  className="px-2.5 py-1 rounded-md bg-stone-800 hover:bg-amber-950/70 text-amber-300 border border-stone-700 hover:border-amber-600/80 text-xs font-serif flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="タグの名前変更・一括削除・表示数の変更・項目への一括付与を行う"
                >
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold">タグの管理・編集</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Tags Strip */}
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-950/40 border border-amber-800/40 rounded-lg text-xs text-amber-200">
          <span className="font-medium shrink-0">選択中のタグ:</span>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selectedTags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-900/80 text-amber-100 border border-amber-700/80"
              >
                <span>#{t}</span>
                <button
                  type="button"
                  onClick={() => handleToggleTag(t)}
                  className="hover:text-rose-300 p-0.5 cursor-pointer"
                  title="このタグを解除"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className="text-[11px] text-amber-300 hover:underline shrink-0 cursor-pointer"
          >
            すべて解除
          </button>
        </div>
      )}

      {/* Grid of Notes */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 border border-dashed border-stone-700 rounded-xl space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-stone-800 flex items-center justify-center text-amber-500/70">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-200">
            {notes.length === 0
              ? 'セッション便利帳はまだ登録されていません（まっさらな状態です）'
              : '該当する項目が見つかりませんでした'}
          </h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            {notes.length === 0
              ? '「＋ 項目を追加」から用語、キャラ作成メモ、セッションのコツなどを自由に登録できます。'
              : '検索キーワードや選択中のタグを変更するか、「絞り込みをすべてリセット」をお試しください。'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setEditingNote(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>＋ 項目を追加</span>
            </button>
            {notes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedTags([]);
                }}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium cursor-pointer"
              >
                絞り込みをすべてリセット
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => {
            const colors = CATEGORY_COLORS[note.category] || CATEGORY_COLORS['その他'];

            return (
              <div
                key={note.id}
                className={`bg-white rounded-xl border ${
                  note.isPinned ? 'border-amber-400/90 shadow-md ring-1 ring-amber-400/40' : 'border-stone-300/80 shadow-xs'
                } flex flex-col justify-between overflow-hidden transition-all hover:shadow-md`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 pb-3 border-b border-stone-200/80 bg-stone-50/70">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Category Badge */}
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${colors.badge}`}>
                        {note.category}
                      </span>

                      {/* Hierarchy / Heading structure badge */}
                      {(note.description.includes('# ') ||
                        note.description.includes('## ') ||
                        note.description.includes('【大分類】') ||
                        note.description.includes('【中分類】')) && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-sans font-bold flex items-center gap-1 shadow-2xs">
                          <Layers className="w-2.5 h-2.5 text-amber-700" />
                          <span>見出し構成</span>
                        </span>
                      )}

                      {/* Image badge if note has image (shows image count if multiple) */}
                      {(() => {
                        const noteImages = (Array.isArray(note.imageUrls) && note.imageUrls.length > 0)
                          ? note.imageUrls
                          : (note.imageUrl ? [note.imageUrl] : []);
                        const hasInlineImg = note.description.includes('![');
                        if (noteImages.length === 0 && !hasInlineImg) return null;
                        const count = noteImages.length;
                        return (
                          <span
                            className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-sans font-bold flex items-center gap-1 shadow-2xs"
                            title={count > 1 ? `${count}枚の添付画像あり` : '画像付き'}
                          >
                            <ImageIcon className="w-2.5 h-2.5 text-sky-700" />
                            <span>画像{count > 1 ? ` (${count})` : ''}</span>
                          </span>
                        );
                      })()}

                      {/* Source Book Reference */}
                      {note.sourceBook && (
                        <span className="text-[11px] text-stone-500 font-serif">
                          {note.sourceBook}
                        </span>
                      )}
                    </div>

                    {/* Actions: Pin & Authenticated Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Pin button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePin(note)}
                        title={note.isPinned ? 'ピン留めを解除' : '上部にピン留め'}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          note.isPinned
                            ? 'text-amber-600 hover:bg-amber-100'
                            : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${note.isPinned ? 'fill-amber-500' : ''}`} />
                      </button>

                      {/* Edit & Delete for authenticated editors */}
                      {isEditorAuthenticated && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNote(note);
                              setIsModalOpen(true);
                            }}
                            title="編集"
                            className="p-1.5 rounded text-stone-400 hover:text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {confirmDeleteId === note.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded border border-rose-300">
                              <button
                                type="button"
                                onClick={() => onDeleteNote(note.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                              >
                                削除
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1 text-stone-500 text-[11px] cursor-pointer"
                              >
                                戻る
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(note.id)}
                              title="削除"
                              className="p-1.5 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold font-detective-title text-stone-900 tracking-wide">
                    {note.title}
                  </h3>

                  {/* Tag List & Card-level Tag Editing Entrypoint */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-stone-150 flex-wrap">
                    <div className="flex flex-wrap gap-1 items-center flex-1">
                      {Array.isArray(note.tags) && note.tags.length > 0 ? (
                        note.tags.map((t) => (
                          <button
                            type="button"
                            key={t}
                            onClick={() => handleToggleTag(t)}
                            title={`「#${t}」で絞り込み`}
                            className={`text-[11px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                              selectedTags.includes(t)
                                ? 'bg-amber-600 text-white font-bold'
                                : 'bg-stone-200/80 text-stone-700 hover:bg-amber-100 hover:text-amber-900'
                            }`}
                          >
                            #{t}
                          </button>
                        ))
                      ) : (
                        <span className="text-[11px] text-stone-400 italic font-serif">タグなし</span>
                      )}

                      {/* Quick Tag Edit Chip on this card */}
                      <button
                        type="button"
                        onClick={() => setQuickTagNote(note)}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-stone-300 text-stone-500 hover:text-amber-800 hover:border-amber-600 hover:bg-amber-50/50 transition-colors flex items-center gap-0.5 cursor-pointer ml-1"
                        title="この項目のタグを追加・変更・削除"
                      >
                        <Tag className="w-2.5 h-2.5 text-amber-700" />
                        <span>タグ編集</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attached Images Gallery (Single or Multiple) */}
                {(() => {
                  const images = (Array.isArray(note.imageUrls) && note.imageUrls.length > 0)
                    ? note.imageUrls.filter(Boolean)
                    : (note.imageUrl ? [note.imageUrl] : []);

                  if (images.length === 0) return null;

                  // 1 image: elegant wide banner
                  if (images.length === 1) {
                    return (
                      <div className="relative group/img overflow-hidden border-b border-stone-200/90 bg-stone-900/5">
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ src: images[0], alt: note.title })}
                          className="w-full h-44 sm:h-52 overflow-hidden block cursor-zoom-in relative bg-stone-100"
                          title="クリックして画像を拡大表示"
                        >
                          <img
                            src={images[0]}
                            alt={note.title}
                            className="w-full h-full object-cover group-hover/img:scale-102 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-stone-950/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-lg bg-stone-900/85 text-amber-200 text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>画像を拡大表示</span>
                            </span>
                          </div>
                        </button>
                      </div>
                    );
                  }

                  // 2 images: 2-column side-by-side
                  if (images.length === 2) {
                    return (
                      <div className="p-2 bg-stone-100/70 border-b border-stone-200/90">
                        <div className="grid grid-cols-2 gap-2">
                          {images.map((imgUrl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setLightboxImage({ src: imgUrl, alt: `${note.title} (#${i + 1})` })}
                              className="relative h-32 sm:h-36 rounded-lg overflow-hidden border border-stone-300/80 bg-stone-900/5 block cursor-zoom-in group/img shadow-2xs"
                              title="クリックして拡大表示"
                            >
                              <img
                                src={imgUrl}
                                alt={`${note.title} (#${i + 1})`}
                                className="w-full h-full object-cover group-hover/img:scale-104 transition-transform duration-300"
                                loading="lazy"
                              />
                              <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-stone-950/80 text-amber-300 text-[10px] font-mono font-bold">
                                #{i + 1}
                              </div>
                              <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="p-1 rounded bg-stone-900/80 text-amber-200 shadow-md">
                                  <ZoomIn className="w-4 h-4" />
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // 3 or more images: responsive multi-image gallery
                  return (
                    <div className="p-2.5 bg-stone-100/70 border-b border-stone-200/90 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium px-0.5">
                        <span className="flex items-center gap-1 text-amber-900 font-bold">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                          <span>添付画像 ({images.length}枚)</span>
                        </span>
                        <span className="text-[10px] text-stone-400">クリックで拡大表示</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {images.map((imgUrl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setLightboxImage({ src: imgUrl, alt: `${note.title} (#${i + 1})` })}
                            className="relative aspect-4/3 rounded-md overflow-hidden border border-stone-300/80 bg-stone-900/5 block cursor-zoom-in group/img shadow-2xs"
                            title={`画像 #${i + 1} を拡大表示`}
                          >
                            <img
                              src={imgUrl}
                              alt={`${note.title} (#${i + 1})`}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute top-0.5 left-0.5 px-1 py-0.1 rounded bg-stone-950/80 text-amber-300 text-[9px] font-mono font-bold">
                              #{i + 1}
                            </div>
                            <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow-md" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Card Body: Formatted Description with Bold and Table support */}
                <div className="p-4 sm:p-5 flex-1 text-xs sm:text-sm text-stone-850">
                  <FormattedNoteContent
                    content={note.description}
                    onImageClick={(src, alt) => setLightboxImage({ src, alt })}
                  />
                </div>

                {/* Card Footer: Source metadata */}
                <div className="px-4 py-2 bg-stone-100/60 border-t border-stone-200/70 text-[11px] text-stone-500 flex items-center justify-between">
                  <span>
                    {note.sourceBook || 'セッション用メモ'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Session Note Modal */}
      <EditSessionNoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        note={editingNote}
        onSave={async (savedNote) => {
          await onSaveNote(savedNote);
          setStatusToast(`便利帳項目「${savedNote.title}」を正常に登録・保存しました`);
          setTimeout(() => setStatusToast(null), 3500);
        }}
        passkey={passkey}
        existingTags={tagCounts.map((tc) => tc[0])}
      />

      {/* Manage Session Note Tags Modal (タグ一括管理・編集モーダル) */}
      <ManageSessionNoteTagsModal
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        notes={notes}
        onBatchUpdateNotes={handleBatchUpdate}
        isEditorAuthenticated={isEditorAuthenticated}
        onOpenAuthModal={onOpenAuthModal}
        tagDisplayLimit={tagDisplayLimit}
        onSetTagDisplayLimit={setTagDisplayLimit}
      />

      {/* Card Quick Tag Modal */}
      {quickTagNote && (
        <QuickCardTagModal
          note={quickTagNote}
          onClose={() => setQuickTagNote(null)}
          onSave={onSaveNote}
          allTags={tagCounts.map((tc) => tc[0])}
          isEditorAuthenticated={isEditorAuthenticated}
          onOpenAuthModal={onOpenAuthModal}
        />
      )}

      {/* Image Lightbox Zoom Modal */}
      <ImageLightboxModal
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

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

/**
 * Quick inline modal to edit tags on a single card
 */
const QuickCardTagModal: React.FC<{
  note: SessionNote;
  onClose: () => void;
  onSave: (note: SessionNote) => Promise<void>;
  allTags: string[];
  isEditorAuthenticated: boolean;
  onOpenAuthModal: () => void;
}> = ({ note, onClose, onSave, allTags, isEditorAuthenticated, onOpenAuthModal }) => {
  const [currentTags, setCurrentTags] = useState<string[]>(() => [...(note.tags || [])]);
  const [inputVal, setInputVal] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddTag = (tagToAdd: string) => {
    const candidates = tagToAdd
      .split(/[,、\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (candidates.length === 0) return;

    const next = [...currentTags];
    candidates.forEach((cand) => {
      if (!next.includes(cand)) {
        next.push(cand);
      }
    });

    setCurrentTags(next);
    setInputVal('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!isEditorAuthenticated) {
      onOpenAuthModal();
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...note,
        tags: currentTags,
        updatedAt: new Date().toISOString()
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'タグの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-stone-900 border border-amber-900/60 rounded-xl w-full max-w-md text-stone-100 shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-amber-100 font-serif truncate max-w-xs">
              「{note.title}」のタグ編集
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Tags Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-300">
            <span>設定中のタグ ({currentTags.length}個):</span>
            {currentTags.length > 0 && (
              <button
                type="button"
                onClick={() => setCurrentTags([])}
                className="text-[11px] text-rose-400 hover:underline cursor-pointer"
              >
                全削除
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 p-2 bg-stone-950/80 rounded-lg border border-stone-800 min-h-[34px]">
            {currentTags.length === 0 ? (
              <span className="text-xs text-stone-500 italic">タグがありません</span>
            ) : (
              currentTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950 text-amber-200 border border-amber-800 text-xs"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-amber-400 hover:text-rose-300 ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Add Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag(inputVal);
              }
            }}
            placeholder="タグ名を入力してEnter（カンマ区切り可）"
            autoFocus
            className="flex-1 px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
          />
          <button
            type="button"
            onClick={() => handleAddTag(inputVal)}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg border border-stone-600 cursor-pointer"
          >
            追加
          </button>
        </div>

        {/* Existing tags chips for 1-click toggle */}
        {allTags.length > 0 && (
          <div className="space-y-1">
            <span className="text-[11px] text-stone-400 block">便利帳で使われているタグ:</span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {allTags.slice(0, 20).map((t) => {
                const isSelected = currentTags.includes(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => (isSelected ? handleRemoveTag(t) : handleAddTag(t))}
                    className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-900/70 text-amber-300 border-amber-700 font-bold'
                        : 'bg-stone-850 text-stone-400 border-stone-750 hover:text-stone-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{saving ? '保存中...' : 'タグを保存'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
