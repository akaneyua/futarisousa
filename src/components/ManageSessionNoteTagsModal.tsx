import React, { useState, useMemo } from 'react';
import {
  X,
  Tag,
  Check,
  Edit2,
  Trash2,
  Plus,
  Search,
  AlertCircle,
  Bookmark,
  Layers,
  Sparkles,
  Sliders,
  CheckSquare,
  Square
} from 'lucide-react';
import { SessionNote } from '../types.ts';

interface ManageSessionNoteTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: SessionNote[];
  onBatchUpdateNotes: (updatedNotes: SessionNote[]) => Promise<void>;
  isEditorAuthenticated: boolean;
  onOpenAuthModal: () => void;
  tagDisplayLimit: number;
  onSetTagDisplayLimit: (limit: number) => void;
}

export const ManageSessionNoteTagsModal: React.FC<ManageSessionNoteTagsModalProps> = ({
  isOpen,
  onClose,
  notes,
  onBatchUpdateNotes,
  isEditorAuthenticated,
  onOpenAuthModal,
  tagDisplayLimit,
  onSetTagDisplayLimit
}) => {
  const [searchTag, setSearchTag] = useState('');
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [newTagNameInput, setNewTagNameInput] = useState('');
  const [selectedNotesForNewTag, setSelectedNotesForNewTag] = useState<string[]>([]);
  const [newTagToApply, setNewTagToApply] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tags' | 'notes' | 'display'>('tags');
  const [confirmDeleteTag, setConfirmDeleteTag] = useState<string | null>(null);

  // Compute tag counts & associations
  const tagStats = useMemo(() => {
    const stats: Record<string, { count: number; noteIds: string[] }> = {};
    notes.forEach((n) => {
      (n.tags || []).forEach((t) => {
        if (!stats[t]) {
          stats[t] = { count: 0, noteIds: [] };
        }
        stats[t].count += 1;
        stats[t].noteIds.push(n.id);
      });
    });

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        count: data.count,
        noteIds: data.noteIds
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [notes]);

  // Filtered tags
  const filteredTagStats = useMemo(() => {
    if (!searchTag.trim()) return tagStats;
    const q = searchTag.toLowerCase().trim();
    return tagStats.filter((t) => t.name.toLowerCase().includes(q));
  }, [tagStats, searchTag]);

  if (!isOpen) return null;

  // Show status feedback
  const showFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // 1. Rename tag across all notes
  const handleRenameTag = async (oldName: string) => {
    if (!isEditorAuthenticated) {
      onOpenAuthModal();
      return;
    }

    const trimmedNew = newTagNameInput.trim();
    if (!trimmedNew) return;
    if (trimmedNew === oldName) {
      setEditingTagName(null);
      return;
    }

    setSaving(true);
    try {
      const affectedNotes = notes.filter((n) => (n.tags || []).includes(oldName));
      const updatedNotes = affectedNotes.map((n) => ({
        ...n,
        tags: Array.from(new Set(n.tags.map((t) => (t === oldName ? trimmedNew : t)))),
        updatedAt: new Date().toISOString()
      }));

      await onBatchUpdateNotes(updatedNotes);
      setEditingTagName(null);
      setNewTagNameInput('');
      showFeedback(`タグ「#${oldName}」を「#${trimmedNew}」（${affectedNotes.length}件）に変更しました`);
    } catch (err: any) {
      alert(err.message || 'タグの変更に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 2. Delete tag from all notes
  const handleDeleteTag = async (tagName: string) => {
    const affectedNotes = notes.filter((n) => (n.tags || []).includes(tagName));
    setSaving(true);
    try {
      const updatedNotes = affectedNotes.map((n) => ({
        ...n,
        tags: (n.tags || []).filter((t) => t !== tagName),
        updatedAt: new Date().toISOString()
      }));

      await onBatchUpdateNotes(updatedNotes);
      showFeedback(`タグ「#${tagName}」を削除しました（${affectedNotes.length}件から除去）`);
    } catch (err: any) {
      showFeedback(err.message || 'タグの削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 3. Add tag to multiple selected notes
  const handleBulkAddTag = async () => {
    if (!isEditorAuthenticated) {
      onOpenAuthModal();
      return;
    }

    const trimmed = newTagToApply.trim();
    if (!trimmed) {
      alert('付与するタグ名を入力してください');
      return;
    }
    if (selectedNotesForNewTag.length === 0) {
      alert('タグを付与する項目を選択してください');
      return;
    }

    setSaving(true);
    try {
      const affectedNotes = notes.filter((n) => selectedNotesForNewTag.includes(n.id));
      const updatedNotes = affectedNotes.map((n) => {
        const curTags = n.tags || [];
        if (curTags.includes(trimmed)) return n;
        return {
          ...n,
          tags: [...curTags, trimmed],
          updatedAt: new Date().toISOString()
        };
      });

      await onBatchUpdateNotes(updatedNotes);
      setNewTagToApply('');
      setSelectedNotesForNewTag([]);
      showFeedback(`「#${trimmed}」を${affectedNotes.length}件の項目に一括付与しました`);
    } catch (err: any) {
      alert(err.message || 'タグの一括付与に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 4. Remove single tag from single note
  const handleRemoveTagFromNote = async (note: SessionNote, tagToRemove: string) => {
    if (!isEditorAuthenticated) {
      onOpenAuthModal();
      return;
    }

    const updatedNote: SessionNote = {
      ...note,
      tags: (note.tags || []).filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString()
    };

    setSaving(true);
    try {
      await onBatchUpdateNotes([updatedNote]);
      showFeedback(`「${note.title}」から「#${tagToRemove}」を外しました`);
    } catch (err: any) {
      alert(err.message || '更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 5. Add tag to single note
  const handleAddTagToNote = async (note: SessionNote, tagToAdd: string) => {
    if (!isEditorAuthenticated) {
      onOpenAuthModal();
      return;
    }

    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if ((note.tags || []).includes(trimmed)) return;

    const updatedNote: SessionNote = {
      ...note,
      tags: [...(note.tags || []), trimmed],
      updatedAt: new Date().toISOString()
    };

    setSaving(true);
    try {
      await onBatchUpdateNotes([updatedNote]);
      showFeedback(`「${note.title}」に「#${trimmed}」を追加しました`);
    } catch (err: any) {
      alert(err.message || '更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-stone-900 border border-amber-900/60 rounded-xl w-full max-w-3xl text-stone-100 shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-900/80 border border-amber-700/60 flex items-center justify-center text-amber-200">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-detective-title text-amber-100 flex items-center gap-2">
                <span>便利帳のタグ管理・編集</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 font-sans font-normal">
                  全{tagStats.length}タグ
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                タグの名前変更・削除・表示数の調整・複数項目への一括付与ができます
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message banner */}
        {statusMessage && (
          <div className="px-5 py-2.5 bg-emerald-950/90 border-b border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-stone-800 bg-stone-950/40 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tags'
                ? 'bg-stone-900 text-amber-200 border-t border-x border-stone-700 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>タグ一覧・編集・削除 ({tagStats.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-stone-900 text-amber-200 border-t border-x border-stone-700 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>項目別のタグ編集・一括付与</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'display'
                ? 'bg-stone-900 text-amber-200 border-t border-x border-stone-700 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ツールバー表示量の設定</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {/* TAB 1: Tags List & Direct Rename / Delete */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              {/* Search filter for tags */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTag}
                    onChange={(e) => setSearchTag(e.target.value)}
                    placeholder="タグ名を絞り込み..."
                    className="w-full pl-8 pr-3 py-1.5 bg-stone-950/80 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="text-xs text-stone-400 font-serif">
                  ※タグ名を変更すると、そのタグがついた全ての項目が一括更新されます
                </div>
              </div>

              {/* Tag List Table */}
              <div className="border border-stone-800 rounded-lg overflow-hidden bg-stone-950/40">
                <div className="max-h-[50vh] overflow-y-auto divide-y divide-stone-800">
                  {filteredTagStats.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 text-xs">
                      該当するタグが見つかりませんでした
                    </div>
                  ) : (
                    filteredTagStats.map((item) => {
                      const isEditing = editingTagName === item.name;

                      return (
                        <div
                          key={item.name}
                          className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-stone-850/50 transition-colors"
                        >
                          {/* Tag name & Note count */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />

                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-1 max-w-md">
                                <input
                                  type="text"
                                  value={newTagNameInput}
                                  onChange={(e) => setNewTagNameInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleRenameTag(item.name);
                                    } else if (e.key === 'Escape') {
                                      setEditingTagName(null);
                                    }
                                  }}
                                  autoFocus
                                  className="px-2 py-1 bg-stone-950 border border-amber-500 rounded text-stone-100 text-xs font-bold w-full focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRenameTag(item.name)}
                                  disabled={saving}
                                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shrink-0 cursor-pointer"
                                >
                                  変更
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTagName(null)}
                                  className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs shrink-0 cursor-pointer"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-amber-200 text-xs sm:text-sm">
                                  #{item.name}
                                </span>
                                <span className="text-[11px] px-2 py-0.2 rounded-full bg-stone-800 text-stone-400 border border-stone-700">
                                  {item.count}件の項目で使用中
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {!isEditing && (
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTagName(item.name);
                                  setNewTagNameInput(item.name);
                                }}
                                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="タグの名前を変更"
                              >
                                <Edit2 className="w-3 h-3 text-amber-400" />
                                <span>名前を変更</span>
                              </button>

                              {confirmDeleteTag === item.name ? (
                                <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded border border-rose-700">
                                  <span className="text-[11px] text-rose-200 font-bold px-1">全{item.count}件から削除？</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteTag(item.name);
                                      setConfirmDeleteTag(null);
                                    }}
                                    disabled={saving}
                                    className="px-2 py-0.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    削除
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteTag(null)}
                                    className="px-1 text-stone-400 hover:text-stone-200 text-[11px] cursor-pointer"
                                  >
                                    戻る
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteTag(item.name)}
                                  className="px-2.5 py-1 rounded bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                  title="このタグをすべての項目から削除"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>タグ削除</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Notes & Bulk Tagging */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Bulk Tag Box */}
              <div className="p-3.5 rounded-lg bg-stone-950/70 border border-amber-900/40 space-y-2.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-serif">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  選択した項目にタグを一括追加
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newTagToApply}
                    onChange={(e) => setNewTagToApply(e.target.value)}
                    placeholder="追加するタグ名を入力（例: 演出Tips, 探偵向け）"
                    className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleBulkAddTag}
                    disabled={saving || !newTagToApply.trim() || selectedNotesForNewTag.length === 0}
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>選択中の {selectedNotesForNewTag.length}件に追加</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                  <span>下のリストからチェックボックスで項目を選択してください</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNotesForNewTag(notes.map((n) => n.id))}
                      className="text-amber-400 hover:underline"
                    >
                      すべて選択
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedNotesForNewTag([])}
                      className="text-stone-400 hover:underline"
                    >
                      選択解除
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes List with Tag Chips & Inline Quick Add/Remove */}
              <div className="border border-stone-800 rounded-lg overflow-hidden bg-stone-950/40">
                <div className="max-h-[48vh] overflow-y-auto divide-y divide-stone-800">
                  {notes.map((note) => {
                    const isChecked = selectedNotesForNewTag.includes(note.id);
                    return (
                      <div
                        key={note.id}
                        className={`p-3 transition-colors ${
                          isChecked ? 'bg-amber-950/30' : 'hover:bg-stone-850/40'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedNotesForNewTag((prev) =>
                                prev.includes(note.id)
                                  ? prev.filter((id) => id !== note.id)
                                  : [...prev, note.id]
                              );
                            }}
                            className="mt-0.5 text-stone-400 hover:text-amber-300 cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-600" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-stone-100 text-xs sm:text-sm font-serif truncate">
                                {note.title}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 border border-stone-700">
                                {note.category}
                              </span>
                            </div>

                            {/* Tags on this note with direct remove ✕ button */}
                            <div className="flex flex-wrap gap-1 items-center">
                              {note.tags && note.tags.length > 0 ? (
                                note.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 text-amber-200 border border-stone-700 text-[11px]"
                                  >
                                    <span>#{t}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTagFromNote(note, t)}
                                      className="text-stone-400 hover:text-rose-300 p-0.2 cursor-pointer"
                                      title={`「#${t}」をこの項目から削除`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-stone-500 italic">タグなし</span>
                              )}

                              {/* Quick add tag chip */}
                              <QuickAddTagChip
                                onAddTag={(newTag) => handleAddTagToNote(note, newTag)}
                                existingTags={tagStats.map((ts) => ts.name)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Tag Display Quantity Settings */}
          {activeTab === 'display' && (
            <div className="space-y-4 p-2 sm:p-4 bg-stone-950/60 rounded-xl border border-stone-800">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>ツールバーのタグ表示件数を調整</span>
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  セッション便利帳の検索ツールバーに表示されるタグの数量（上位何件を表示するか）を変更できます。
                  タグが増えて画面が見づらくなった時は、主要タグのみに絞ってすっきりさせることができます。
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {[
                  { label: '主要 8件', value: 8, desc: 'コンパクト' },
                  { label: '標準 15件', value: 15, desc: 'おすすめ' },
                  { label: '多め 30件', value: 30, desc: '豊富に表示' },
                  { label: 'すべて表示', value: 9999, desc: `全${tagStats.length}件` }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onSetTagDisplayLimit(opt.value);
                      showFeedback(`タグ表示量を「${opt.label}」に設定しました`);
                    }}
                    className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                      tagDisplayLimit === opt.value
                        ? 'bg-amber-900/80 text-amber-100 border-amber-500 ring-2 ring-amber-500/40 shadow-md'
                        : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-750 hover:text-stone-100'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm">{opt.label}</div>
                    <div className="text-[11px] text-stone-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-400 mt-3 font-serif">
                ※ 表示数を絞った場合でも、「タグで絞り込み」欄の右端にある「もっと見る」ボタンで一時的に全件を展開して探すことができます。
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-stone-800 bg-stone-950/70 flex items-center justify-between text-xs text-stone-400">
          <span>※編集操作は保存後に自動で反映されます</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Small inline chip button to quickly add a tag to a note
 */
const QuickAddTagChip: React.FC<{
  onAddTag: (tag: string) => void;
  existingTags: string[];
}> = ({ onAddTag, existingTags }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [val, setVal] = useState('');

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-stone-700 text-stone-400 hover:text-amber-300 hover:border-amber-600 transition-colors flex items-center gap-0.5 cursor-pointer"
        title="この項目にタグを追加"
      >
        <Plus className="w-3 h-3" />
        <span>追加</span>
      </button>
    );
  }

  const handleAdd = () => {
    if (val.trim()) {
      onAddTag(val.trim());
      setVal('');
    }
    setIsOpen(false);
  };

  return (
    <div className="inline-flex items-center gap-1 bg-stone-900 p-0.5 rounded border border-amber-600 animate-in fade-in">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        placeholder="タグ名"
        autoFocus
        className="w-20 px-1 py-0.5 bg-stone-950 text-[11px] text-stone-100 border border-stone-700 rounded focus:outline-hidden"
      />
      <button
        type="button"
        onClick={handleAdd}
        className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-[10px] font-bold rounded cursor-pointer"
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="px-1 text-stone-400 hover:text-stone-200 text-[10px] cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
};
