import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Edit,
  Check,
  RotateCcw,
  Shield,
  Layers,
  Square,
  Sparkles,
  ClipboardList,
  Coffee,
  AlertTriangle,
  Search,
  KeyRound,
  Flag,
  MessageSquare,
  Edit2,
  Plus,
  CheckSquare,
  Trash2,
  Save,
  Copy
} from 'lucide-react';
import { SessionSummary, PhaseSummary, PhaseRequirementItem } from '../types.ts';
import { INITIAL_SESSION_SUMMARIES } from '../initialGuestAndSummaryData.ts';
import { EditSessionSummaryModal } from './EditSessionSummaryModal.tsx';

interface SessionSummaryViewProps {
  summaries: SessionSummary[];
  onSaveSummary: (summary: SessionSummary) => Promise<void>;
  onDeleteSummary: (summaryId: string) => Promise<void>;
  onResetSummaries?: () => Promise<void>;
  isEditorAuthenticated: boolean;
  passkey: string;
  onOpenAuthModal: () => void;
}

interface PhaseConfig {
  key: keyof Pick<
    SessionSummary,
    'tamariPhase' | 'incidentPhase' | 'investigationPhase' | 'truthPhase' | 'endingPhase'
  >;
  name: string;
  shortName: string;
  stepNumber: number;
  icon: React.FC<{ className?: string }>;
  badgeClass: string;
  cardBorderClass: string;
  cardBgClass: string;
  accentClass: string;
  description: string;
}

const PHASES_CONFIG: PhaseConfig[] = [
  {
    key: 'tamariPhase',
    name: 'たまり場フェイズ',
    shortName: 'たまり場',
    stepNumber: 1,
    icon: Coffee,
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    cardBorderClass: 'border-amber-200/90',
    cardBgClass: 'bg-amber-50/40',
    accentClass: 'text-amber-800',
    description: '探偵事務所や行きつけの店で過ごす日常。フタリの関係性を深め事件前の準備を整える。'
  },
  {
    key: 'incidentPhase',
    name: '事件発生フェイズ',
    shortName: '事件発生',
    stepNumber: 2,
    icon: AlertTriangle,
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    cardBorderClass: 'border-rose-200/90',
    cardBgClass: 'bg-rose-50/40',
    accentClass: 'text-rose-800',
    description: '事件が起こる、あるいは依頼人が来訪。事件の基本情報を共有し、正式に依頼を受託して現場へ急行する。'
  },
  {
    key: 'investigationPhase',
    name: '捜査フェイズ',
    shortName: '捜査',
    stepNumber: 3,
    icon: Search,
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    cardBorderClass: 'border-indigo-200/90',
    cardBgClass: 'bg-indigo-50/40',
    accentClass: 'text-indigo-800',
    description: '現場のシチュエーション調査や聞き込み。手がかりやキーワードを収集し、真相への突入条件を満たす。'
  },
  {
    key: 'truthPhase',
    name: '真相フェイズ',
    shortName: '真相',
    stepNumber: 4,
    icon: KeyRound,
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    cardBorderClass: 'border-purple-200/90',
    cardBgClass: 'bg-purple-50/40',
    accentClass: 'text-purple-800',
    description: 'すべての関係者を集め、探偵が華麗に推理を披露！ 犯人のトリックと動機を暴くクライマックス。'
  },
  {
    key: 'endingPhase',
    name: '終了フェイズ',
    shortName: '終了',
    stepNumber: 5,
    icon: Flag,
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    cardBorderClass: 'border-emerald-200/90',
    cardBgClass: 'bg-emerald-50/40',
    accentClass: 'text-emerald-800',
    description: '事件の終息と警察への引き渡し。依頼人からの感謝を受け取り、探偵と助手が穏やかな日常へと帰還する。'
  }
];

// Helper to normalize requirement items
const normalizeReqItem = (item: string | PhaseRequirementItem): PhaseRequirementItem => {
  if (typeof item === 'object' && item !== null) {
    return {
      text: item.text || '',
      comment: item.comment?.trim() || undefined
    };
  }
  const str = String(item || '').trim();
  if (str.includes(' // ')) {
    const [t, ...c] = str.split(' // ');
    return { text: t.trim(), comment: c.join(' // ').trim() };
  }
  return { text: str };
};

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({
  summaries,
  onSaveSummary,
  onDeleteSummary,
  onResetSummaries,
  isEditorAuthenticated,
  passkey,
  onOpenAuthModal
}) => {
  // Active selected summary ID (persisted across browser reloads)
  const [selectedSummaryId, setSelectedSummaryId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('futarisousa_selected_summary_id');
      if (saved && summaries.some((s) => s.id === saved)) {
        return saved;
      }
    } catch {}
    return summaries.length > 0 ? summaries[0].id : (INITIAL_SESSION_SUMMARIES[0]?.id || 'session-flow-summary');
  });

  const handleSelectSummary = (id: string) => {
    setSelectedSummaryId(id);
    try {
      localStorage.setItem('futarisousa_selected_summary_id', id);
    } catch {}
  };

  const pendingSelectedIdRef = React.useRef<string | null>(null);

  // Current active summary
  const currentSummary = useMemo(() => {
    if (summaries.length === 0) return null;
    const found = summaries.find((s) => s.id === selectedSummaryId);
    return found || summaries[0];
  }, [summaries, selectedSummaryId]);

  // Keep selectedSummaryId in sync when summaries list updates
  useEffect(() => {
    if (pendingSelectedIdRef.current) {
      if (summaries.some((s) => s.id === pendingSelectedIdRef.current)) {
        const id = pendingSelectedIdRef.current;
        setSelectedSummaryId(id);
        try {
          localStorage.setItem('futarisousa_selected_summary_id', id);
        } catch {}
        pendingSelectedIdRef.current = null;
        return;
      }
    }
    try {
      const saved = localStorage.getItem('futarisousa_selected_summary_id');
      if (saved && summaries.some((s) => s.id === saved)) {
        if (selectedSummaryId !== saved) {
          setSelectedSummaryId(saved);
        }
        return;
      }
    } catch {}
    if (summaries.length > 0 && !summaries.some((s) => s.id === selectedSummaryId)) {
      setSelectedSummaryId(summaries[0].id);
    }
  }, [summaries, selectedSummaryId]);

  // Active phase tab ('all' or specific phase key)
  const [activePhaseTab, setActivePhaseTab] = useState<string>('tamariPhase');

  // Interactive Checklist State (stored per session and per summary in LocalStorage)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('futarisousa_session_checks') || '{}');
    } catch {
      return {};
    }
  });

  const toggleCheck = (itemKey: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [itemKey]: !prev[itemKey] };
      try {
        localStorage.setItem('futarisousa_session_checks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleClearChecks = () => {
    setCheckedItems({});
    try {
      localStorage.removeItem('futarisousa_session_checks');
    } catch {}
    setStatusMessage('チェック状態をリセットしました');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  // Quick inline item add state
  const [addingItemPhase, setAddingItemPhase] = useState<PhaseConfig['key'] | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [newItemComment, setNewItemComment] = useState('');

  // Inline item edit state (text + comment)
  const [editingItemTarget, setEditingItemTarget] = useState<{
    phaseKey: PhaseConfig['key'];
    itemIndex: number;
  } | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [editingItemComment, setEditingItemComment] = useState('');

  // Inline comment editing target state
  const [editingCommentTarget, setEditingCommentTarget] = useState<{
    phaseKey: PhaseConfig['key'];
    itemIndex: number;
  } | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>('');

  // Inline phase summary & notes editing state
  const [editingSummaryPhase, setEditingSummaryPhase] = useState<PhaseConfig['key'] | null>(null);
  const [summaryDraft, setSummaryDraft] = useState('');

  const [editingNotesPhase, setEditingNotesPhase] = useState<PhaseConfig['key'] | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showQuickCreateBar, setShowQuickCreateBar] = useState(false);
  const [quickSummaryTitle, setQuickSummaryTitle] = useState('');

  // Quick Create Summary (one-step registration)
  const handleQuickCreateSummary = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalTitle = quickSummaryTitle.trim() || `新規進行サマリー (${summaries.length + 1})`;
    // Deep clone template to avoid reference issues
    const defaultTemplate = JSON.parse(JSON.stringify(INITIAL_SESSION_SUMMARIES[0] || {}));
    const newId = `summary-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newSummary: SessionSummary = {
      ...defaultTemplate,
      id: newId,
      title: finalTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      pendingSelectedIdRef.current = newId;
      await onSaveSummary(newSummary);
      handleSelectSummary(newId);
      setQuickSummaryTitle('');
      setShowQuickCreateBar(false);
      setStatusMessage(`進行サマリー「${finalTitle}」を新しく登録しました`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      setStatusMessage(err.message || '進行サマリーの登録に失敗しました');
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Duplicate current summary
  const handleDuplicateCurrentSummary = async () => {
    if (!currentSummary) return;
    const newId = `summary-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duplicate: SessionSummary = {
      ...JSON.parse(JSON.stringify(currentSummary)),
      id: newId,
      title: `${currentSummary.title}（コピー）`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      await onSaveSummary(duplicate);
      handleSelectSummary(newId);
      setStatusMessage(`「${duplicate.title}」を作成しました`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(err.message || '複製の作成に失敗しました');
    }
  };

  // Delete current summary
  const handleDeleteCurrentSummary = () => {
    if (!currentSummary) return;
    setConfirmDialog({
      title: '進行サマリーの削除',
      message: `「${currentSummary.title}」を削除してもよろしいですか？\nこの操作は取り消せません。`,
      confirmLabel: '削除する',
      isDanger: true,
      onConfirm: async () => {
        try {
          await onDeleteSummary(currentSummary.id);
          setStatusMessage('進行サマリーを削除しました');
          setTimeout(() => setStatusMessage(null), 3000);
        } catch (err: any) {
          setStatusMessage(err.message || '削除に失敗しました');
        }
      }
    });
  };

  // Helper to extract requirement items with normalized text & comment
  const getPhaseRequirements = (phase?: PhaseSummary): PhaseRequirementItem[] => {
    if (!phase) return [];
    const list =
      Array.isArray(phase.sceneEndRequirements) && phase.sceneEndRequirements.length > 0
        ? phase.sceneEndRequirements
        : Array.isArray(phase.checkpoints) && phase.checkpoints.length > 0
        ? phase.checkpoints
        : [];
    return list.map(normalizeReqItem).filter((it) => it.text.trim().length > 0);
  };

  // Add new item directly inline
  const handleAddNewItem = async (phaseKey: PhaseConfig['key']) => {
    if (!currentSummary) return;
    const trimmedText = newItemText.trim();
    const trimmedComment = newItemComment.trim();
    if (!trimmedText && !trimmedComment) {
      setAddingItemPhase(null);
      return;
    }
    try {
      const currentPhase = currentSummary[phaseKey];
      const reqs = getPhaseRequirements(currentPhase);
      const updatedReqs: PhaseRequirementItem[] = [
        ...reqs,
        {
          text: trimmedText || trimmedComment,
          comment: trimmedComment || undefined
        }
      ];
      const updatedSummary: SessionSummary = {
        ...currentSummary,
        [phaseKey]: {
          ...currentPhase,
          sceneEndRequirements: updatedReqs,
          checkpoints: updatedReqs
        },
        updatedAt: new Date().toISOString()
      };
      await onSaveSummary(updatedSummary);
      setAddingItemPhase(null);
      setNewItemText('');
      setNewItemComment('');
      setStatusMessage('注意する項目を追加しました');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setStatusMessage(err.message || '追加に失敗しました');
    }
  };

  // Start editing item text and comment
  const handleStartEditItem = (
    phaseKey: PhaseConfig['key'],
    itemIndex: number,
    item: PhaseRequirementItem
  ) => {
    setEditingItemTarget({ phaseKey, itemIndex });
    setEditingItemText(item.text);
    setEditingItemComment(item.comment || '');
    setEditingCommentTarget(null);
  };

  // Save item edit (text + comment)
  const handleSaveItemEdit = async (phaseKey: PhaseConfig['key'], itemIndex: number) => {
    if (!currentSummary) return;
    try {
      const currentPhase = currentSummary[phaseKey];
      const reqs = getPhaseRequirements(currentPhase);
      const updatedReqs = reqs.map((req, i) => {
        if (i === itemIndex) {
          return {
            text: editingItemText.trim() || req.text,
            comment: editingItemComment.trim() ? editingItemComment.trim() : undefined
          };
        }
        return req;
      });

      const updatedSummary: SessionSummary = {
        ...currentSummary,
        [phaseKey]: {
          ...currentPhase,
          sceneEndRequirements: updatedReqs,
          checkpoints: updatedReqs
        },
        updatedAt: new Date().toISOString()
      };

      await onSaveSummary(updatedSummary);
      setEditingItemTarget(null);
      setStatusMessage('項目を更新しました');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setStatusMessage(err.message || '更新に失敗しました');
    }
  };

  // Delete an item
  const handleDeleteItem = async (phaseKey: PhaseConfig['key'], itemIndex: number) => {
    if (!currentSummary) return;
    try {
      const currentPhase = currentSummary[phaseKey];
      const reqs = getPhaseRequirements(currentPhase);
      const updatedReqs = reqs.filter((_, i) => i !== itemIndex);

      const updatedSummary: SessionSummary = {
        ...currentSummary,
        [phaseKey]: {
          ...currentPhase,
          sceneEndRequirements: updatedReqs,
          checkpoints: updatedReqs
        },
        updatedAt: new Date().toISOString()
      };

      await onSaveSummary(updatedSummary);
      setEditingItemTarget(null);
      setStatusMessage('項目を削除しました');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setStatusMessage(err.message || '削除に失敗しました');
    }
  };

  // Start inline editing of comment
  const handleStartEditComment = (
    phaseKey: PhaseConfig['key'],
    itemIndex: number,
    currentComment: string
  ) => {
    setEditingCommentTarget({ phaseKey, itemIndex });
    setEditingCommentText(currentComment);
    setEditingItemTarget(null);
  };

  // Cancel inline comment editing
  const handleCancelEditComment = () => {
    setEditingCommentTarget(null);
    setEditingCommentText('');
  };

  // Save inline comment
  const handleSaveComment = async (phaseKey: PhaseConfig['key'], itemIndex: number) => {
    if (!currentSummary) return;
    try {
      const currentPhase = currentSummary[phaseKey];
      const reqs = getPhaseRequirements(currentPhase);
      const updatedReqs = reqs.map((req, i) => {
        if (i === itemIndex) {
          return {
            ...req,
            comment: editingCommentText.trim() ? editingCommentText.trim() : undefined
          };
        }
        return req;
      });

      const updatedSummary: SessionSummary = {
        ...currentSummary,
        [phaseKey]: {
          ...currentPhase,
          sceneEndRequirements: updatedReqs,
          checkpoints: updatedReqs
        },
        updatedAt: new Date().toISOString()
      };

      await onSaveSummary(updatedSummary);
      setEditingCommentTarget(null);
      setEditingCommentText('');
      setStatusMessage('項目のコメントを保存しました');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setStatusMessage(err.message || 'コメントの保存に失敗しました');
    }
  };

  // Save phase summary directly inline
  const handleSavePhaseSummary = async (phaseKey: PhaseConfig['key']) => {
    if (!currentSummary) return;
    try {
      const currentPhase = currentSummary[phaseKey];
      const updatedSummary: SessionSummary = {
        ...currentSummary,
        [phaseKey]: {
          ...currentPhase,
          summary: summaryDraft.trim()
        },
        updatedAt: new Date().toISOString()
      };
      await onSaveSummary(updatedSummary);
      setEditingSummaryPhase(null);
      setStatusMessage('セッションの流れを更新しました');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setStatusMessage(err.message || '更新に失敗しました');
    }
  };

  // Save phase notes directly inline
  const handleSavePhaseNotes = async (phaseKey: PhaseConfig['key']) => {
    if (!currentSummary) return;
    try {
      const currentPhase = currentSummary[phaseKey];
      const updatedSummary: SessionSummary = {
        ...currentSummary,
        [phaseKey]: {
          ...currentPhase,
          notes: notesDraft.trim()
        },
        updatedAt: new Date().toISOString()
      };
      await onSaveSummary(updatedSummary);
      setEditingNotesPhase(null);
      setStatusMessage('共通メモを更新しました');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setStatusMessage(err.message || '更新に失敗しました');
    }
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Toast Notice */}
      {statusMessage && (
        <div className="p-3 bg-amber-950/80 border border-amber-700 text-amber-200 text-xs rounded-xl flex items-center justify-between animate-in fade-in shadow-md">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-amber-400 hover:text-white cursor-pointer px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Switcher Tabs Bar */}
      <section className="bg-white rounded-xl shadow-xs border border-stone-200/90 p-2 sm:p-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-serif font-bold text-stone-500 shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>進行サマリー:</span>
            </span>
            {summaries.length === 0 ? (
              <span className="text-xs text-stone-400">（登録サマリーなし）</span>
            ) : (
              summaries.map((s, idx) => {
                const isSelected = (currentSummary?.id || '') === s.id;
                return (
                  <button
                    key={s.id || idx}
                    type="button"
                    onClick={() => handleSelectSummary(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-900 text-amber-100 border-amber-800 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span>{s.title || '無題のサマリー'}</span>
                    {s.estimatedTime && (
                      <span className="text-[10px] opacity-75 font-sans font-normal">
                        ({s.estimatedTime})
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowQuickCreateBar((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs font-serif flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                showQuickCreateBar
                  ? 'bg-stone-800 text-stone-200'
                  : 'bg-amber-600 hover:bg-amber-500 text-stone-950'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{showQuickCreateBar ? '登録フォームを閉じる' : '＋ サマリー新規登録'}</span>
            </button>
          </div>
        </div>

        {/* Inline Quick Create Summary Drawer */}
        {showQuickCreateBar && (
          <form
            onSubmit={handleQuickCreateSummary}
            className="p-3 bg-stone-900 rounded-xl border border-amber-600 text-stone-100 space-y-2.5 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 font-serif flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>新しい進行サマリーのクイック登録</span>
              </span>
              <span className="text-[11px] text-stone-400">※5フェイズ共通の標準フローが自動セットされます</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                type="text"
                value={quickSummaryTitle}
                onChange={(e) => setQuickSummaryTitle(e.target.value)}
                placeholder="サマリー名・シナリオ名を入力（例: 第1話 亡霊館の秘密進行フロー）"
                className="flex-1 px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 font-serif"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs font-serif flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>今すぐ登録</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(true);
                  setIsEditModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-amber-200 font-bold text-xs font-serif flex items-center justify-center gap-1 cursor-pointer border border-stone-700 shrink-0"
              >
                <span>各フェイズ詳細編集へ</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Top Banner & Control Bar */}
      <section className="bg-white rounded-xl shadow-xs border border-stone-200/90 p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-800 text-amber-100 flex items-center justify-center font-serif font-bold text-base shadow-xs shrink-0">
              進
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900">
                  {currentSummary?.title || '進行サマリー'}
                </h2>
                {currentSummary?.estimatedTime && (
                  <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    {currentSummary.estimatedTime}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                {currentSummary?.overview || '様々なセッションで共通の、シーン終了時に注意する項目・セッションの流れ・確認メモ'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {Object.values(checkedItems).some(Boolean) && (
              <button
                type="button"
                onClick={handleClearChecks}
                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer border border-stone-300"
                title="セッション中のチェックをすべてリセット"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>チェック全解除</span>
              </button>
            )}

            {/* Register New Summary Button */}
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(true);
                setIsEditModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>＋ サマリー新規登録</span>
            </button>

            {/* Edit Current Summary Button */}
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                setIsEditModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center gap-1 transition-colors border border-stone-300 cursor-pointer shadow-xs"
              title="このサマリーのタイトル・概要・全フェイズを一括編集"
            >
              <Edit className="w-3.5 h-3.5 text-stone-600" />
              <span>編集</span>
            </button>

            {/* Duplicate Button */}
            <button
              type="button"
              onClick={handleDuplicateCurrentSummary}
              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium flex items-center gap-1 transition-colors border border-stone-300 cursor-pointer shadow-xs"
              title="このサマリーを複製して新しいサマリーを作成"
            >
              <Copy className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">複製</span>
            </button>

            {/* Delete Button (If more than 1 summary exists) */}
            {summaries.length > 1 && (
              <button
                type="button"
                onClick={handleDeleteCurrentSummary}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium flex items-center gap-1 transition-colors border border-rose-200 cursor-pointer shadow-xs"
                title="このサマリーを削除"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">削除</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Summary Selector Bar if multiple summaries exist */}
        {summaries.length > 1 && (
          <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto text-xs font-serif pb-1">
            <span className="text-stone-400 font-bold shrink-0 text-[11px]">サマリー切替:</span>
            {summaries.map((s) => {
              const isSelected = (currentSummary?.id === s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSummaryId(s.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all font-bold shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-900 text-amber-100 border-amber-800 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Phase Navigation Tabs */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-serif font-bold">
            {PHASES_CONFIG.map((phase) => {
              const isActive = activePhaseTab === phase.key;
              const Icon = phase.icon;
              return (
                <button
                  key={phase.key}
                  type="button"
                  onClick={() => setActivePhaseTab(phase.key)}
                  className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-amber-900 text-amber-100 border-amber-800 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span>
                    {phase.stepNumber}. {phase.shortName}
                  </span>
                </button>
              );
            })}

            <div className="w-px h-6 bg-stone-200 mx-1 shrink-0" />

            <button
              type="button"
              onClick={() => setActivePhaseTab('all')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                activePhaseTab === 'all'
                  ? 'bg-stone-900 text-amber-200 border-stone-900 shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span>全フェイズ一括表示</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {currentSummary ? (
        <div className="space-y-4">
          {PHASES_CONFIG.filter(
            (p) => activePhaseTab === 'all' || activePhaseTab === p.key
          ).map((phaseConfig) => {
            const phaseData = currentSummary[phaseConfig.key];
            const requirements = getPhaseRequirements(phaseData);
            const isAddingToThisPhase = addingItemPhase === phaseConfig.key;

            return (
              <section
                key={phaseConfig.key}
                className={`bg-white rounded-xl shadow-xs border ${phaseConfig.cardBorderClass} overflow-hidden transition-all`}
              >
                {/* Phase Header */}
                <div
                  className={`${phaseConfig.cardBgClass} p-3.5 sm:p-4 border-b border-stone-200/80 flex items-center justify-between flex-wrap gap-2`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg ${phaseConfig.badgeClass} flex items-center justify-center font-serif font-bold text-xs shadow-2xs`}
                    >
                      {phaseConfig.stepNumber}
                    </div>
                    <div>
                      <h3 className="font-bold text-base font-serif text-stone-900 flex items-center gap-2">
                        <span>{phaseConfig.name}</span>
                      </h3>
                      <p className="text-xs text-stone-500 font-serif">
                        {phaseConfig.description}
                      </p>
                    </div>
                  </div>

                  {/* Quick Add Button on Header */}
                  <button
                    type="button"
                    onClick={() => {
                      setAddingItemPhase(phaseConfig.key);
                      setNewItemText('');
                      setNewItemComment('');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-800/90 hover:bg-amber-700 text-amber-100 text-xs font-serif font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    title="このフェイズに注意項目を追加"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>＋ 項目追加</span>
                  </button>
                </div>

                {/* Phase Body */}
                <div className="p-4 sm:p-5 space-y-4 font-serif">
                  {/* Summary / Flow of the session */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>セッションの流れ・進行概要</span>
                      </div>
                      {editingSummaryPhase !== phaseConfig.key && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSummaryPhase(phaseConfig.key);
                            setSummaryDraft(phaseData?.summary || '');
                          }}
                          className="text-[11px] text-stone-500 hover:text-amber-800 flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>流れを編集</span>
                        </button>
                      )}
                    </div>

                    {editingSummaryPhase === phaseConfig.key ? (
                      <div className="p-3 bg-stone-900 rounded-xl border border-amber-600/70 space-y-2 text-stone-100 animate-in fade-in">
                        <textarea
                          rows={3}
                          value={summaryDraft}
                          onChange={(e) => setSummaryDraft(e.target.value)}
                          placeholder="セッションの流れ・進行概要を入力..."
                          className="w-full p-2.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 leading-relaxed font-serif"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 text-xs font-sans">
                          <button
                            type="button"
                            onClick={() => setEditingSummaryPhase(null)}
                            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 cursor-pointer"
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePhaseSummary(phaseConfig.key)}
                            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>保存</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line bg-stone-50/70 p-3.5 rounded-xl border border-stone-200/80">
                        {phaseData?.summary || 'セッションの流れは未設定です。'}
                      </p>
                    )}
                  </div>

                  {/* Caution / Requirements Items (注意する項目) */}
                  <div className="space-y-3 bg-amber-50/50 p-4 sm:p-4.5 rounded-xl border border-amber-200/80 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-amber-200/70 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-amber-900 text-amber-100 flex items-center justify-center font-mono font-bold text-xs shadow-2xs">
                          □
                        </span>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-amber-950 font-serif">
                            注意する項目（シーン終了・進行の要点）
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-amber-900 font-sans font-bold bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                          {requirements.length} 項目
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingItemPhase(phaseConfig.key);
                            setNewItemText('');
                            setNewItemComment('');
                          }}
                          className="px-2 py-0.5 rounded bg-amber-700 hover:bg-amber-600 text-white text-[11px] font-sans font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>追加</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Item Addition Box */}
                    {isAddingToThisPhase && (
                      <div className="p-3 bg-stone-900 rounded-xl border border-amber-500 shadow-md space-y-2.5 text-stone-100 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs text-amber-300 font-bold font-sans">
                          <span className="flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-amber-400" />
                            新しい注意項目の追加
                          </span>
                          <span className="text-[11px] text-stone-400 font-normal">
                            （Enterで保存）
                          </span>
                        </div>
                        <input
                          type="text"
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setAddingItemPhase(null);
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddNewItem(phaseConfig.key);
                            }
                          }}
                          placeholder="注意する項目を入力（例: 助手の【余裕】の初期値を確認する）"
                          className="w-full p-2 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 font-serif"
                          autoFocus
                        />
                        <div className="flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-2" />
                          <input
                            type="text"
                            value={newItemComment}
                            onChange={(e) => setNewItemComment(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setAddingItemPhase(null);
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddNewItem(phaseConfig.key);
                              }
                            }}
                            placeholder="補足コメント・注意メモ（任意、例: 現在値をシート等にメモ）"
                            className="w-full p-2 bg-stone-950/80 border border-stone-800 rounded-lg text-xs text-amber-200 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 font-sans"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 text-xs font-sans pt-1">
                          <button
                            type="button"
                            onClick={() => setAddingItemPhase(null)}
                            className="px-2.5 py-1 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 cursor-pointer"
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddNewItem(phaseConfig.key)}
                            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>項目を追加</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {requirements.length > 0 ? (
                      <div className="space-y-2.5 pt-1">
                        {requirements.map((req, idx) => {
                          const itemKey = `${currentSummary.id}-${phaseConfig.key}-${idx}`;
                          const isChecked = Boolean(checkedItems[itemKey]);

                          const isEditingThisItem =
                            editingItemTarget?.phaseKey === phaseConfig.key &&
                            editingItemTarget?.itemIndex === idx;

                          const isEditingThisComment =
                            editingCommentTarget?.phaseKey === phaseConfig.key &&
                            editingCommentTarget?.itemIndex === idx;

                          return (
                            <div
                              key={idx}
                              className={`p-3 sm:p-3.5 rounded-xl border transition-all group ${
                                isChecked
                                  ? 'bg-stone-50/80 border-stone-200 opacity-70'
                                  : 'bg-white border-stone-200/90 shadow-2xs hover:border-amber-300'
                              }`}
                            >
                              {/* Full Item Editor (Text + Comment) */}
                              {isEditingThisItem ? (
                                <div className="p-3 bg-stone-900 rounded-xl border border-amber-500 space-y-2.5 text-stone-100 animate-in fade-in">
                                  <div className="flex items-center justify-between text-xs text-amber-300 font-bold font-sans">
                                    <span>項目 #{idx + 1} の編集</span>
                                    <span className="text-[11px] text-stone-400 font-normal">
                                      （Escでキャンセル）
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={editingItemText}
                                    onChange={(e) => setEditingItemText(e.target.value)}
                                    placeholder="項目名を入力..."
                                    className="w-full p-2 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 font-serif focus:outline-hidden focus:border-amber-500"
                                    autoFocus
                                  />
                                  <div className="flex items-start gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-2" />
                                    <textarea
                                      rows={2}
                                      value={editingItemComment}
                                      onChange={(e) => setEditingItemComment(e.target.value)}
                                      placeholder="補足コメント・注意メモ（任意）..."
                                      className="w-full p-2 bg-stone-950 border border-stone-700 rounded-lg text-xs text-amber-200 font-sans focus:outline-hidden focus:border-amber-500"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between pt-1 text-xs font-sans">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteItem(phaseConfig.key, idx)}
                                      className="px-2 py-1 rounded bg-stone-850 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-700 text-xs flex items-center gap-1 cursor-pointer"
                                      title="この項目を削除"
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-400" />
                                      <span>削除</span>
                                    </button>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setEditingItemTarget(null)}
                                        className="px-2.5 py-1 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 cursor-pointer"
                                      >
                                        キャンセル
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveItemEdit(phaseConfig.key, idx)}
                                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>保存</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Main Item Text with Interactive Checkbox Button */}
                                  <div className="flex items-start justify-between gap-2.5">
                                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => toggleCheck(itemKey)}
                                        className={`font-mono text-sm sm:text-base font-bold px-1.5 py-0.5 rounded shrink-0 leading-none cursor-pointer transition-all mt-0.5 shadow-2xs select-none ${
                                          isChecked
                                            ? 'bg-emerald-700 text-white border border-emerald-600 scale-105'
                                            : 'bg-amber-100/90 text-amber-950 border border-amber-300 hover:bg-amber-200'
                                        }`}
                                        title={isChecked ? 'クリックして未チェックに戻す' : 'クリックして完了にする'}
                                      >
                                        {isChecked ? '☑' : '□'}
                                      </button>

                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={`text-xs sm:text-sm font-bold leading-relaxed font-serif transition-colors ${
                                            isChecked
                                              ? 'text-stone-400 line-through'
                                              : 'text-stone-900'
                                          }`}
                                        >
                                          {req.text}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Action buttons (Edit item, add comment, delete) */}
                                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                      {(!req.comment || !req.comment.trim()) && !isEditingThisComment && (
                                        <button
                                          type="button"
                                          onClick={() => handleStartEditComment(phaseConfig.key, idx, '')}
                                          className="p-1 text-stone-400 hover:text-amber-800 rounded hover:bg-amber-50 cursor-pointer flex items-center gap-1 text-[11px]"
                                          title="コメントを追加"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                          <span className="hidden sm:inline">コメント</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditItem(phaseConfig.key, idx, req)}
                                        className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100 cursor-pointer flex items-center gap-1 text-[11px]"
                                        title="項目を編集"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">編集</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Comment Display or Inline Editor */}
                                  {isEditingThisComment ? (
                                    <div className="mt-2.5 p-3 bg-stone-900 rounded-xl border border-amber-600/70 shadow-md space-y-2 text-stone-100 animate-in fade-in">
                                      <div className="flex items-center justify-between text-xs text-amber-300 font-bold font-sans">
                                        <span className="flex items-center gap-1.5">
                                          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                          項目のコメントを入力・編集
                                        </span>
                                        <span className="text-[11px] text-stone-400 font-normal">
                                          （Escでキャンセル / Ctrl+Enterで保存）
                                        </span>
                                      </div>
                                      <textarea
                                        rows={2}
                                        value={editingCommentText}
                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Escape') handleCancelEditComment();
                                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                            handleSaveComment(phaseConfig.key, idx);
                                          }
                                        }}
                                        placeholder="この項目に関する注意点や補足メモを入力..."
                                        className="w-full p-2 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 leading-relaxed font-sans"
                                        autoFocus
                                      />
                                      <div className="flex items-center justify-end gap-2 text-xs font-sans">
                                        <button
                                          type="button"
                                          onClick={handleCancelEditComment}
                                          className="px-2.5 py-1 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 cursor-pointer"
                                        >
                                          キャンセル
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveComment(phaseConfig.key, idx)}
                                          className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>保存</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : req.comment && req.comment.trim() ? (
                                    <div className="mt-2.5 ml-0 sm:ml-7 bg-amber-50/70 border border-amber-200/70 rounded-lg p-2.5 flex items-start justify-between gap-2 text-xs">
                                      <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                        <MessageSquare className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5 flex-1 min-w-0">
                                          <span className="font-bold text-amber-950 block text-[11px] font-sans">
                                            コメント / 補足メモ
                                          </span>
                                          <p className="text-stone-700 leading-relaxed whitespace-pre-wrap font-sans">
                                            {req.comment}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStartEditComment(phaseConfig.key, idx, req.comment || '')
                                        }
                                        className="px-2 py-1 rounded bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-[11px] font-sans font-medium flex items-center gap-1 transition-colors shrink-0 shadow-2xs cursor-pointer"
                                        title="コメントを編集"
                                      >
                                        <Edit2 className="w-3 h-3 text-stone-500" />
                                        <span>編集</span>
                                      </button>
                                    </div>
                                  ) : null}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-stone-500 py-3 text-center bg-white/60 rounded-lg border border-dashed border-stone-200 space-y-1.5">
                        <p>注意する項目の登録はありません。</p>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingItemPhase(phaseConfig.key);
                            setNewItemText('');
                            setNewItemComment('');
                          }}
                          className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white text-xs font-sans font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>最初の項目を追加</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Phase Notes & Common Reminders */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-700 block text-xs">
                        ◆ 共通メモ・注意点
                      </span>
                      {editingNotesPhase !== phaseConfig.key && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotesPhase(phaseConfig.key);
                            setNotesDraft(phaseData?.notes || '');
                          }}
                          className="text-[11px] text-stone-500 hover:text-amber-800 flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>メモを編集</span>
                        </button>
                      )}
                    </div>

                    {editingNotesPhase === phaseConfig.key ? (
                      <div className="p-3 bg-stone-900 rounded-xl border border-amber-600/70 space-y-2 text-stone-100 animate-in fade-in">
                        <textarea
                          rows={2}
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          placeholder="フェイズ共通メモ・注意点を入力..."
                          className="w-full p-2.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 leading-relaxed font-serif"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 text-xs font-sans">
                          <button
                            type="button"
                            onClick={() => setEditingNotesPhase(null)}
                            className="px-2.5 py-1 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 cursor-pointer"
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePhaseNotes(phaseConfig.key)}
                            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>保存</span>
                          </button>
                        </div>
                      </div>
                    ) : phaseData?.notes ? (
                      <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
                        <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                          {phaseData.notes}
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-stone-400 py-1">
                        共通メモの登録はありません。
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-stone-200 text-stone-500 text-xs font-serif space-y-3">
          <p className="font-bold text-stone-700 text-sm">進行サマリーデータはまだ登録されていません</p>
          <p className="text-stone-500 text-xs">「＋ サマリー新規作成」ボタンからフェイズごとの進行サマリーを作成するか、バックアップから復元できます。</p>
          <button
            type="button"
            onClick={() => {
              setIsCreatingNew(true);
              setIsEditModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>＋ サマリー新規作成</span>
          </button>
        </div>
      )}

      {/* Edit Modal */}
      <EditSessionSummaryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setIsCreatingNew(false);
        }}
        summary={isCreatingNew ? null : currentSummary}
        isNew={isCreatingNew}
        onSave={async (saved) => {
          pendingSelectedIdRef.current = saved.id;
          await onSaveSummary(saved);
          handleSelectSummary(saved.id);
          setIsEditModalOpen(false);
          setIsCreatingNew(false);
          setStatusMessage(
            isCreatingNew
              ? `進行サマリー「${saved.title}」を新しく登録しました`
              : `進行サマリー「${saved.title}」を更新しました`
          );
          setTimeout(() => setStatusMessage(null), 3500);
        }}
        passkey={passkey}
        initialPhaseTab={activePhaseTab === 'all' ? 'tamariPhase' : activePhaseTab}
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
