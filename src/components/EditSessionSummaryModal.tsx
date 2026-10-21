import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  AlertCircle,
  Layers,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  FileText,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { SessionSummary, PhaseSummary, PhaseRequirementItem } from '../types.ts';
import { INITIAL_SESSION_SUMMARIES } from '../initialGuestAndSummaryData.ts';

interface EditSessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: SessionSummary | null;
  isNew?: boolean;
  onSave: (summary: SessionSummary) => Promise<void>;
  passkey: string;
  initialPhaseTab?: string;
}

const PHASES_CONFIG = [
  {
    key: 'tamariPhase' as const,
    name: 'たまり場フェイズ',
    description: '探偵と助手の日常、フタリの関係性、導入前の準備',
    badgeColor: 'bg-amber-900 text-amber-200 border-amber-700',
    defaultTitle: 'たまり場フェイズ',
    placeholderSummary:
      '探偵事務所や行きつけの店などで過ごす日常のシーン。探偵と助手の関係性を演出し、事件が始まる前のウォーミングアップを行います。',
    placeholderNotes:
      '助手の「余裕」はセッション全体の重要リソースです。開始時の数値をシート等に明記しておきましょう。'
  },
  {
    key: 'incidentPhase' as const,
    name: '事件発生フェイズ',
    description: '事件の発生、依頼人の来訪、事件の受諾と現場移動',
    badgeColor: 'bg-rose-950 text-rose-200 border-rose-800',
    defaultTitle: '事件発生フェイズ',
    placeholderSummary:
      '依頼人（ゲストNPC）の来訪、または事件現場への急行。事件の概要と解明すべき謎（知ること）が提示され、正式に捜査を開始します。',
    placeholderNotes:
      'ゲストへの第一印象や感情の獲得ルールを確認し、現場への移動描写を挟むとスムーズです。'
  },
  {
    key: 'investigationPhase' as const,
    name: '捜査フェイズ',
    description: 'シチュエーション調査、手がかり収集、アクション判定',
    badgeColor: 'bg-indigo-950 text-indigo-200 border-indigo-800',
    defaultTitle: '捜査フェイズ',
    placeholderSummary:
      '現場のシチュエーション調査や聞き込みを繰り返すメインフェイズ。手がかりや【キーワード】を集め、助手の余裕を管理しながら真相を追い詰めます。',
    placeholderNotes:
      '助手の余裕は調査表を振るごとに消費されます。探偵の固有アクションや助手の自動取得アクションを活用しましょう。'
  },
  {
    key: 'truthPhase' as const,
    name: '真相フェイズ',
    description: '探偵の推理披露、犯人の告発、トリックの解明',
    badgeColor: 'bg-purple-950 text-purple-200 border-purple-800',
    defaultTitle: '真相フェイズ',
    placeholderSummary:
      '関係者全員を集めて探偵が華麗に推理を披露するクライマックス！ 集めたキーワードをすべて使ってトリックと犯人を暴きます。',
    placeholderNotes:
      '探偵の大見せ場です！ 助手がフォロー役として相槌や演出を入れるとバディとしての完成度が高まります。'
  },
  {
    key: 'endingPhase' as const,
    name: '終了フェイズ',
    description: '事件の終息、警察への引き渡し、後日談と日常への帰還',
    badgeColor: 'bg-emerald-950 text-emerald-200 border-emerald-800',
    defaultTitle: '終了フェイズ',
    placeholderSummary:
      '事件の解決処理、警察への引き渡し、報酬の受け取り、そして探偵と助手が穏やかな日常へ戻るエピローグ。',
    placeholderNotes:
      '「今回の事件はどうだった？」とお互いのPCを称え合い、感想戦を行ってセッションを締めくくります。'
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

export const EditSessionSummaryModal: React.FC<EditSessionSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  isNew = false,
  onSave,
  passkey,
  initialPhaseTab = 'tamariPhase'
}) => {
  const [activeTab, setActiveTab] = useState<
    'tamariPhase' | 'incidentPhase' | 'investigationPhase' | 'truthPhase' | 'endingPhase'
  >('tamariPhase');

  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  const [phaseData, setPhaseData] = useState<{
    tamariPhase: { title: string; summary: string; items: PhaseRequirementItem[]; notes: string };
    incidentPhase: { title: string; summary: string; items: PhaseRequirementItem[]; notes: string };
    investigationPhase: { title: string; summary: string; items: PhaseRequirementItem[]; notes: string };
    truthPhase: { title: string; summary: string; items: PhaseRequirementItem[]; notes: string };
    endingPhase: { title: string; summary: string; items: PhaseRequirementItem[]; notes: string };
  }>({
    tamariPhase: { title: 'たまり場フェイズ', summary: '', items: [], notes: '' },
    incidentPhase: { title: '事件発生フェイズ', summary: '', items: [], notes: '' },
    investigationPhase: { title: '捜査フェイズ', summary: '', items: [], notes: '' },
    truthPhase: { title: '真相フェイズ', summary: '', items: [], notes: '' },
    endingPhase: { title: '終了フェイズ', summary: '', items: [], notes: '' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const prevIsOpenRef = React.useRef(false);

  const loadDataFromSummary = (src: SessionSummary | null, isCreatingNew: boolean) => {
    if (isCreatingNew || !src) {
      setTitle('');
      setOverview('');
      setEstimatedTime('');
      setPhaseData({
        tamariPhase: { title: 'たまり場フェイズ', summary: '', items: [], notes: '' },
        incidentPhase: { title: '事件発生フェイズ', summary: '', items: [], notes: '' },
        investigationPhase: { title: '捜査フェイズ', summary: '', items: [], notes: '' },
        truthPhase: { title: '真相フェイズ', summary: '', items: [], notes: '' },
        endingPhase: { title: '終了フェイズ', summary: '', items: [], notes: '' }
      });
      return;
    }

    const target = src;
    setTitle(target.title || '進行サマリー');
    setOverview(target.overview || '');
    setEstimatedTime(target.estimatedTime || '');

    const getReqItems = (p?: PhaseSummary): PhaseRequirementItem[] => {
      if (!p) return [];
      const raw = p.sceneEndRequirements || p.checkpoints || [];
      return raw.map(normalizeReqItem).filter((it) => it.text.trim().length > 0);
    };

    setPhaseData({
      tamariPhase: {
        title: target.tamariPhase?.title || 'たまり場フェイズ',
        summary: target.tamariPhase?.summary || '',
        items: getReqItems(target.tamariPhase),
        notes: target.tamariPhase?.notes || ''
      },
      incidentPhase: {
        title: target.incidentPhase?.title || '事件発生フェイズ',
        summary: target.incidentPhase?.summary || '',
        items: getReqItems(target.incidentPhase),
        notes: target.incidentPhase?.notes || ''
      },
      investigationPhase: {
        title: target.investigationPhase?.title || '捜査フェイズ',
        summary: target.investigationPhase?.summary || '',
        items: getReqItems(target.investigationPhase),
        notes: target.investigationPhase?.notes || ''
      },
      truthPhase: {
        title: target.truthPhase?.title || '真相フェイズ',
        summary: target.truthPhase?.summary || '',
        items: getReqItems(target.truthPhase),
        notes: target.truthPhase?.notes || ''
      },
      endingPhase: {
        title: target.endingPhase?.title || '終了フェイズ',
        summary: target.endingPhase?.summary || '',
        items: getReqItems(target.endingPhase),
        notes: target.endingPhase?.notes || ''
      }
    });
  };

  const prevSummaryIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const summaryId = summary?.id || (isNew ? '__new__' : null);
      if (!prevIsOpenRef.current || prevSummaryIdRef.current !== summaryId) {
        loadDataFromSummary(summary, isNew);

        if (initialPhaseTab && PHASES_CONFIG.some((p) => p.key === initialPhaseTab)) {
          setActiveTab(initialPhaseTab as any);
        }
        setErrorMessage(null);
        setShowBulkInput(false);
        setBulkText('');
        prevSummaryIdRef.current = summaryId;
      }
    } else {
      prevSummaryIdRef.current = null;
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, summary, isNew, initialPhaseTab]);

  if (!isOpen) return null;

  const currentPhaseConfig = PHASES_CONFIG.find((p) => p.key === activeTab)!;
  const currentPhaseState = phaseData[activeTab];

  // Reset to default standard 5-phase template
  const handleLoadDefaultTemplate = () => {
    const defaultTemplate = INITIAL_SESSION_SUMMARIES[0];
    if (!title.trim()) {
      setTitle(defaultTemplate.title);
    }
    setOverview(defaultTemplate.overview);
    setEstimatedTime(defaultTemplate.estimatedTime || '');

    const getReqItems = (p?: PhaseSummary): PhaseRequirementItem[] => {
      if (!p) return [];
      const raw = p.sceneEndRequirements || p.checkpoints || [];
      return raw.map(normalizeReqItem).filter((it) => it.text.trim().length > 0);
    };

    setPhaseData({
      tamariPhase: {
        title: defaultTemplate.tamariPhase?.title || 'たまり場フェイズ',
        summary: defaultTemplate.tamariPhase?.summary || '',
        items: getReqItems(defaultTemplate.tamariPhase),
        notes: defaultTemplate.tamariPhase?.notes || ''
      },
      incidentPhase: {
        title: defaultTemplate.incidentPhase?.title || '事件発生フェイズ',
        summary: defaultTemplate.incidentPhase?.summary || '',
        items: getReqItems(defaultTemplate.incidentPhase),
        notes: defaultTemplate.incidentPhase?.notes || ''
      },
      investigationPhase: {
        title: defaultTemplate.investigationPhase?.title || '捜査フェイズ',
        summary: defaultTemplate.investigationPhase?.summary || '',
        items: getReqItems(defaultTemplate.investigationPhase),
        notes: defaultTemplate.investigationPhase?.notes || ''
      },
      truthPhase: {
        title: defaultTemplate.truthPhase?.title || '真相フェイズ',
        summary: defaultTemplate.truthPhase?.summary || '',
        items: getReqItems(defaultTemplate.truthPhase),
        notes: defaultTemplate.truthPhase?.notes || ''
      },
      endingPhase: {
        title: defaultTemplate.endingPhase?.title || '終了フェイズ',
        summary: defaultTemplate.endingPhase?.summary || '',
        items: getReqItems(defaultTemplate.endingPhase),
        notes: defaultTemplate.endingPhase?.notes || ''
      }
    });
    setErrorMessage(null);
  };

  // Clear all items to start fresh
  const handleClearAllItems = () => {
    setPhaseData({
      tamariPhase: { title: 'たまり場フェイズ', summary: '', items: [], notes: '' },
      incidentPhase: { title: '事件発生フェイズ', summary: '', items: [], notes: '' },
      investigationPhase: { title: '捜査フェイズ', summary: '', items: [], notes: '' },
      truthPhase: { title: '真相フェイズ', summary: '', items: [], notes: '' },
      endingPhase: { title: '終了フェイズ', summary: '', items: [], notes: '' }
    });
  };

  // Update phase summary or notes
  const handleUpdateCurrentPhaseField = (field: 'summary' | 'notes', value: string) => {
    setPhaseData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value
      }
    }));
  };

  // Add new requirement item
  const handleAddItem = () => {
    setPhaseData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        items: [...prev[activeTab].items, { text: '', comment: '' }]
      }
    }));
  };

  // Update item field (text or comment)
  const handleUpdateItem = (index: number, field: 'text' | 'comment', value: string) => {
    setPhaseData((prev) => {
      const nextItems = [...prev[activeTab].items];
      nextItems[index] = {
        ...nextItems[index],
        [field]: value
      };
      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          items: nextItems
        }
      };
    });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setPhaseData((prev) => {
      const nextItems = prev[activeTab].items.filter((_, idx) => idx !== index);
      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          items: nextItems
        }
      };
    });
  };

  // Move item up/down
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    setPhaseData((prev) => {
      const items = [...prev[activeTab].items];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          items
        }
      };
    });
  };

  // Bulk input apply
  const handleApplyBulkText = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const newItems: PhaseRequirementItem[] = lines.map((line) => {
      if (line.includes(' // ')) {
        const [t, ...c] = line.split(' // ');
        return { text: t.trim(), comment: c.join(' // ').trim() };
      }
      return { text: line.trim() };
    });

    setPhaseData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        items: [...prev[activeTab].items, ...newItems]
      }
    }));
    setBulkText('');
    setShowBulkInput(false);
  };

  const handleTabChange = (targetTab: typeof activeTab) => {
    if (bulkText.trim()) {
      handleApplyBulkText();
    }
    setActiveTab(targetTab);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = (title || '').trim() || '新規進行サマリー';

    setIsSubmitting(true);

    try {
      // Auto-apply any unapplied bulk text
      let currentTabItems = [...(phaseData[activeTab]?.items || [])];
      if ((bulkText || '').trim()) {
        const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
        const newItems: PhaseRequirementItem[] = lines.map((line) => {
          if (line.includes(' // ')) {
            const [t, ...c] = line.split(' // ');
            return { text: (t || '').trim(), comment: c.join(' // ').trim() };
          }
          return { text: (line || '').trim() };
        });
        currentTabItems = [...currentTabItems, ...newItems];
      }

      const buildPhase = (key: keyof typeof phaseData): PhaseSummary => {
        const p = phaseData[key] || { title: '', summary: '', items: [], notes: '' };
        const itemsToUse = key === activeTab ? currentTabItems : (p.items || []);
        const validItems = itemsToUse
          .map((it) => ({
            text: (it?.text || '').trim(),
            comment: (it?.comment || '').trim() || undefined
          }))
          .filter((it) => it.text.length > 0 || (it.comment && it.comment.length > 0))
          .map((it) => ({
            text: it.text.length > 0 ? it.text : (it.comment || '注意項目'),
            comment: it.comment
          }));

        return {
          title: p.title || '',
          summary: (p.summary || '').trim(),
          sceneEndRequirements: validItems,
          checkpoints: validItems,
          notes: (p.notes || '').trim()
        };
      };

      // Determine target ID
      let targetId: string;
      if (isNew || !summary) {
        targetId = `summary-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      } else {
        targetId = summary.id;
      }

      const payload: SessionSummary = {
        id: targetId,
        title: trimmedTitle,
        overview: (overview || '').trim(),
        estimatedTime: (estimatedTime || '').trim(),
        tamariPhase: buildPhase('tamariPhase'),
        incidentPhase: buildPhase('incidentPhase'),
        investigationPhase: buildPhase('investigationPhase'),
        truthPhase: buildPhase('truthPhase'),
        endingPhase: buildPhase('endingPhase'),
        createdAt: (!isNew && summary?.createdAt) ? summary.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Session summary save error:', err);
      setErrorMessage(err.message || '進行サマリーの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs font-serif overflow-y-auto animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-900/90 text-amber-200 flex items-center justify-center font-bold text-sm shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-100 flex items-center gap-2">
                <span>{isNew || !summary ? '進行サマリーの新規登録' : '進行サマリーの編集'}</span>
              </h2>
              <p className="text-xs text-stone-400">
                各フェイズの流れ、シーン終了時に注意する項目（チェック項目・補足コメント）、共通メモを設定できます
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {errorMessage && (
            <div className="m-4 p-3 bg-rose-950/90 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Basic Info: Title & Overview */}
          <div className="p-4 sm:p-5 bg-stone-950/70 border-b border-stone-800 space-y-3 shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-amber-200 flex items-center gap-1">
                  <span>サマリー名 / シナリオ名</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: セッション進行サマリー（5フェイズ共通）、洋館の怪奇事件 など"
                  className="w-full px-3 py-2 bg-stone-850 border border-stone-700 rounded-lg text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 font-serif"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-300">
                  備考 / 推定時間
                </label>
                <input
                  type="text"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="例: 3〜4時間、全セッション共通"
                  className="w-full px-3 py-2 bg-stone-850 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 font-serif"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-300">
                全体概要・説明
              </label>
              <textarea
                rows={2}
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                placeholder="このサマリーの概要や、シナリオの全体方針、PLへの共有事項..."
                className="w-full px-3 py-1.5 bg-stone-850 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 font-serif leading-relaxed"
              />
            </div>

            {/* Template helpers */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-stone-850 text-xs">
              <span className="text-[11px] text-stone-400">
                テンプレート操作:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadDefaultTemplate}
                  className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-750 text-amber-200 border border-stone-700 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                  title="5フェイズ標準テンプレートの内容を読み込む"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>標準テンプレートを読み込む</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAllItems}
                  className="px-2.5 py-1 rounded bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-700 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                  title="すべてのフェイズの項目をクリアして白紙にする"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>白紙にする</span>
                </button>
              </div>
            </div>
          </div>

          {/* Phase Tabs Bar */}
          <div className="p-3 bg-stone-950/50 border-b border-stone-800 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              {PHASES_CONFIG.map((phase, idx) => {
                const isActive = activeTab === phase.key;
                const itemsCount = phaseData[phase.key].items.length;
                return (
                  <button
                    key={phase.key}
                    type="button"
                    onClick={() => handleTabChange(phase.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-amber-900 text-amber-100 border border-amber-700 shadow-sm'
                        : 'bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-black/40 text-[10px] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span>{phase.name}</span>
                    <span className="text-[10px] text-amber-400/80 font-mono">
                      ({itemsCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Phase Content Editor */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            <div className="bg-stone-850/60 p-3 rounded-xl border border-stone-800 space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${currentPhaseConfig.badgeColor}`}
                >
                  {currentPhaseConfig.name}
                </span>
                <span className="text-xs text-stone-400">
                  {currentPhaseConfig.description}
                </span>
              </div>
            </div>

            {/* Phase Summary */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-300">
                フェイズ概要・セッションの流れ
              </label>
              <textarea
                rows={3}
                value={currentPhaseState.summary}
                onChange={(e) => handleUpdateCurrentPhaseField('summary', e.target.value)}
                placeholder={currentPhaseConfig.placeholderSummary}
                className="w-full p-2.5 bg-stone-850 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 leading-relaxed font-serif"
              />
            </div>

            {/* Requirements Items with Comments */}
            <div className="space-y-2 bg-stone-950/60 p-3.5 sm:p-4 rounded-xl border border-amber-900/40">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-stone-800 pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.2 rounded border border-amber-800 text-amber-300 bg-amber-950">
                      □
                    </span>
                    <label className="text-xs font-bold text-amber-300">
                      注意する項目（チェック項目と補足コメント）
                    </label>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    項目内容と、その項目に対する補足コメントを登録できます
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkInput(!showBulkInput)}
                    className="text-[11px] text-stone-400 hover:text-stone-200 underline cursor-pointer flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{showBulkInput ? 'テキスト入力を閉じる' : 'テキスト一括追加'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>項目を追加</span>
                  </button>
                </div>
              </div>

              {/* Bulk text input toggle */}
              {showBulkInput && (
                <div className="p-3 rounded-lg bg-stone-900 border border-stone-700 space-y-2 text-xs">
                  <div className="text-[11px] text-stone-400">
                    複数行を貼り付けて追加できます（「項目名 // コメント」の形式でコメントも同時登録可能）
                  </div>
                  <textarea
                    rows={3}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="助手の【余裕】の初期値を確認する // 探偵との関係性に応じて相談&#10;探偵の【こだわり】を確認・宣言する"
                    className="w-full p-2 bg-stone-950 border border-stone-700 rounded text-xs text-stone-100 font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkInput(false)}
                      className="px-2.5 py-1 rounded bg-stone-800 text-stone-300 text-xs"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyBulkText}
                      disabled={!bulkText.trim()}
                      className="px-3 py-1 rounded bg-amber-600 text-stone-950 font-bold text-xs disabled:opacity-50"
                    >
                      一括追加する
                    </button>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3 pt-1">
                {currentPhaseState.items.length === 0 ? (
                  <div className="p-4 text-center text-stone-500 text-xs border border-dashed border-stone-800 rounded-lg">
                    登録されている項目がありません。「項目を追加」ボタンから登録してください。
                  </div>
                ) : (
                  currentPhaseState.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-900 rounded-lg border border-stone-800 hover:border-amber-900/60 transition-colors space-y-2 relative group"
                    >
                      {/* Item Header & Controls */}
                      <div className="flex items-center justify-between text-xs text-stone-400">
                        <div className="flex items-center gap-1.5 font-bold text-amber-200">
                          <span className="font-mono text-amber-400">□</span>
                          <span>項目 #{idx + 1}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Reorder buttons */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveItem(idx, 'up')}
                            className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-30 cursor-pointer"
                            title="上へ移動"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === currentPhaseState.items.length - 1}
                            onClick={() => handleMoveItem(idx, 'down')}
                            className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-30 cursor-pointer"
                            title="下へ移動"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                            title="この項目を削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Item Text Input */}
                      <div>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => handleUpdateItem(idx, 'text', e.target.value)}
                          placeholder="注意する項目を入力（例: 助手の【余裕】の初期値を確認する）"
                          className="w-full px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500"
                        />
                      </div>

                      {/* Item Comment Input */}
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-2" />
                        <textarea
                          rows={2}
                          value={item.comment || ''}
                          onChange={(e) => handleUpdateItem(idx, 'comment', e.target.value)}
                          placeholder="コメント・補足メモを入力（任意、例: 探偵との関係性に応じて相談して決める）"
                          className="w-full px-3 py-1.5 bg-stone-950/70 border border-stone-800 rounded-lg text-xs text-amber-100/90 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 font-sans"
                        />
                      </div>
                    </div>
                  ))
                )}

                {/* Add Item Bottom Button */}
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2 border border-dashed border-stone-700 hover:border-amber-600/80 rounded-lg text-xs text-stone-400 hover:text-amber-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新しい項目を追加</span>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-300">
                共通メモ・注意点・ルール確認事項
              </label>
              <textarea
                rows={2}
                value={currentPhaseState.notes}
                onChange={(e) => handleUpdateCurrentPhaseField('notes', e.target.value)}
                placeholder={currentPhaseConfig.placeholderNotes}
                className="w-full p-2.5 bg-stone-850 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 leading-relaxed font-serif"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-2 shrink-0">
            <span className="text-[11px] text-stone-400 truncate">
              {isNew || !summary ? '※ 新規サマリーとしてリストに追加登録されます' : '※ 変更内容はサーバーおよび端末に保存されます'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 text-xs font-medium transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isSubmitting
                    ? '保存中...'
                    : (isNew || !summary ? '進行サマリーを新規登録' : '進行サマリーを保存')}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
