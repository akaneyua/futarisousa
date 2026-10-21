import React, { useState } from 'react';
import { CharacterClass, CharacterRole, CharacterSkill } from '../types.ts';
import {
  X,
  Book,
  Edit3,
  Trash2,
  Copy,
  Check,
  ClipboardCheck,
  GraduationCap,
  FileText,
  Sparkles,
  Plus,
  Edit2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Quote
} from 'lucide-react';

interface ClassDetailProps {
  characterClass: CharacterClass | null;
  onClose: () => void;
  onOpenEdit?: () => void;
  onDeleteClass?: () => void;
  onAddSkill?: () => void;
  onEditSkill?: (skill: CharacterSkill) => void;
  isEditorAuthenticated?: boolean;
  availableAutoSkills?: CharacterSkill[];
  onUpdateClassAutoSkills?: (classId: string, autoSkills: CharacterSkill[]) => Promise<void>;
}

export const ClassDetail: React.FC<ClassDetailProps> = ({
  characterClass: c,
  onClose,
  onOpenEdit,
  onDeleteClass,
  isEditorAuthenticated = false,
  availableAutoSkills = [],
  onUpdateClassAutoSkills,
}) => {
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [lastCopiedKey, setLastCopiedKey] = useState<string | null>(null);

  // 自動修得アクションの手入力・編集モーダル状態
  const [isAddingAutoSkill, setIsAddingAutoSkill] = useState(false);
  const [editingAutoSkillItem, setEditingAutoSkillItem] = useState<CharacterSkill | null>(null);
  const [skillFormName, setSkillFormName] = useState('');
  const [skillFormType, setSkillFormType] = useState('補助');
  const [skillFormCost, setSkillFormCost] = useState('なし');
  const [skillFormDesc, setSkillFormDesc] = useState('');
  const [skillFormFlavor, setSkillFormFlavor] = useState('');
  const [savingSkill, setSavingSkill] = useState(false);
  const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);

  // 削除インライン確認状態 (skillId)
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);

  // 自動修得アクション欄の展開状態
  const [showAutoSection, setShowAutoSection] = useState(true);

  if (!c) return null;

  // このクラスの有効な自動修得アクション（autoSkills が設定されていればそれを尊重、未指定の場合は役割共通の登録アクション）
  const effectiveAutoActions: CharacterSkill[] =
    Array.isArray(c.autoSkills)
      ? c.autoSkills
      : availableAutoSkills.filter(
          (a) => a.role === c.role || (c.role === '刑事' && (a.role === 'ゲスト' || a.role === '刑事'))
        );

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

  // 背景表の一括コピー（背景表のみコピー可能とする）
  const copyFullBackgrounds = () => {
    if (!c.backgroundTable || c.backgroundTable.length === 0) return;
    const lines = [
      `【${c.name} (${c.role}) 背景表】`,
      ...c.backgroundTable.map((b) => `${b.roll}: ${b.title} - ${b.description}`)
    ];
    copyText(lines.join('\n'), `${c.name} 背景表一括`, 'bg-all');
  };

  // アクション名だけをコピー
  const copySkillName = (sk: CharacterSkill) => {
    copyText(sk.name, `アクション名: ${sk.name}`, `name-${sk.id}`);
  };

  // タイプだけをコピー
  const copySkillType = (sk: CharacterSkill) => {
    const typeVal = sk.type || sk.timing || '補助';
    copyText(typeVal, `タイプ: ${typeVal}`, `type-${sk.id}`);
  };

  // コストだけをコピー
  const copySkillCost = (sk: CharacterSkill) => {
    const costVal = sk.cost || sk.target || 'なし';
    copyText(costVal, `コスト: ${costVal}`, `cost-${sk.id}`);
  };

  // 内容（効果）だけをコピー
  const copySkillDesc = (sk: CharacterSkill) => {
    copyText(sk.description, `${sk.name}の内容`, `desc-${sk.id}`);
  };

  // フレーバーテキストだけをコピー
  const copySkillFlavor = (sk: CharacterSkill) => {
    if (!sk.flavor) return;
    copyText(sk.flavor, `${sk.name}のフレーバー`, `flavor-${sk.id}`);
  };

  // アクション全体をコピー
  const copySkillFull = (sk: CharacterSkill) => {
    const text = `【${sk.name}】(自動取得 / タイプ: ${sk.type || sk.timing || '補助'} / コスト: ${
      sk.cost || sk.target || 'なし'
    })\n効果: ${sk.description}${sk.flavor ? `\nフレーバー: ${sk.flavor}` : ''}`;
    copyText(text, `${sk.name} 全体`, `full-${sk.id}`);
  };

  const handleOpenAddAutoSkill = () => {
    setEditingAutoSkillItem(null);
    setSkillFormName('');
    setSkillFormType('補助');
    setSkillFormCost('なし');
    setSkillFormDesc('');
    setSkillFormFlavor('');
    setFormErrorMsg(null);
    setIsAddingAutoSkill(true);
  };

  const handleOpenEditAutoSkill = (sk: CharacterSkill, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAutoSkillItem(sk);
    setSkillFormName(sk.name);
    setSkillFormType(sk.type || sk.timing || '補助');
    setSkillFormCost(sk.cost || sk.target || 'なし');
    setSkillFormDesc(sk.description || '');
    setSkillFormFlavor(sk.flavor || '');
    setFormErrorMsg(null);
    setIsAddingAutoSkill(true);
  };

  const handleSaveAutoSkillForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillFormName.trim()) {
      setFormErrorMsg('アクション名を入力してください');
      return;
    }
    if (!skillFormDesc.trim()) {
      setFormErrorMsg('効果・内容（ルール詳細）を入力してください');
      return;
    }

    setSavingSkill(true);
    setFormErrorMsg(null);

    try {
      const skillId = editingAutoSkillItem?.id || `auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newSkill: CharacterSkill = {
        id: skillId,
        name: skillFormName.trim(),
        role: c.role as any,
        category: '自動取得',
        type: skillFormType.trim() || '補助',
        timing: skillFormType.trim() || '補助',
        cost: skillFormCost.trim() || 'なし',
        target: skillFormCost.trim() || 'なし',
        description: skillFormDesc.trim(),
        flavor: skillFormFlavor.trim(),
        relatedSituationIds: editingAutoSkillItem?.relatedSituationIds || []
      };

      let updatedList: CharacterSkill[];
      if (editingAutoSkillItem) {
        updatedList = effectiveAutoActions.map((s) => (s.id === editingAutoSkillItem.id ? newSkill : s));
      } else {
        updatedList = [...effectiveAutoActions, newSkill];
      }

      if (onUpdateClassAutoSkills) {
        await onUpdateClassAutoSkills(c.id, updatedList);
      }

      setIsAddingAutoSkill(false);
      setEditingAutoSkillItem(null);
      setCopyToast(`自動取得アクション「${newSkill.name}」を保存しました`);
      setTimeout(() => setCopyToast(null), 2500);
    } catch (err: any) {
      setFormErrorMsg(err.message || 'アクションの保存に失敗しました');
    } finally {
      setSavingSkill(false);
    }
  };

  const handleConfirmDeleteAutoSkill = async (skillId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedList = effectiveAutoActions.filter((s) => s.id !== skillId);
      if (onUpdateClassAutoSkills) {
        await onUpdateClassAutoSkills(c.id, updatedList);
      }
      setDeletingSkillId(null);
      setCopyToast('自動取得アクションを削除しました');
      setTimeout(() => setCopyToast(null), 2200);
    } catch (err: any) {
      setFormErrorMsg(err.message || '削除に失敗しました');
    }
  };

  const getRoleHeaderStyle = (role: CharacterRole) => {
    switch (role) {
      case '探偵':
        return 'border-amber-700 bg-amber-950/90 text-amber-100';
      case '助手':
        return 'border-teal-700 bg-teal-950/90 text-teal-100';
      case '刑事':
        return 'border-indigo-700 bg-indigo-950/90 text-indigo-100';
      default:
        return 'border-stone-700 bg-stone-900 text-stone-100';
    }
  };

  const getRoleBadgeStyle = (role: CharacterRole) => {
    switch (role) {
      case '探偵':
        return 'bg-amber-900 text-amber-200 border-amber-700';
      case '助手':
        return 'bg-teal-900 text-teal-200 border-teal-700';
      case '刑事':
        return 'bg-indigo-900 text-indigo-200 border-indigo-700';
      default:
        return 'bg-stone-800 text-stone-200 border-stone-600';
    }
  };

  return (
    <div
      id="class-detail-overlay"
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex justify-center items-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-stone-900 text-amber-100 px-4 py-2 rounded-full shadow-2xl border border-amber-500/50 flex items-center gap-2 text-xs font-serif animate-in slide-in-from-top duration-200">
          <ClipboardCheck className="w-4 h-4 text-amber-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Main Dialog Modal */}
      <div
        id="class-detail-modal"
        className="w-full max-w-3xl bg-stone-100 rounded-xl shadow-2xl border-2 border-stone-800 my-auto flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className={`px-5 py-3.5 flex items-center justify-between border-b-2 shrink-0 select-none ${getRoleHeaderStyle(
            c.role
          )}`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-bold font-serif border ${getRoleBadgeStyle(
                c.role
              )}`}
            >
              {c.role} 調書
            </span>
            <h2 className="text-base sm:text-lg font-bold font-detective-title truncate tracking-wide">
              {c.name}
            </h2>
            <span className="text-xs font-mono opacity-80 hidden sm:inline-block">
              [{c.alias}]
            </span>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Copy Background Table (Only background table and auto skills are copyable) */}
            {c.backgroundTable && c.backgroundTable.length > 0 && (
              <button
                type="button"
                onClick={copyFullBackgrounds}
                className="text-stone-300 hover:text-amber-200 p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title="背景表を一括コピー"
              >
                {lastCopiedKey === 'bg-all' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">背景表コピー</span>
              </button>
            )}

            {/* Edit Class Button (if authenticated) */}
            {isEditorAuthenticated && onOpenEdit && (
              <button
                type="button"
                onClick={onOpenEdit}
                className="text-stone-300 hover:text-amber-200 p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title="クラス調書を編集"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">調書編集</span>
              </button>
            )}

            {/* Delete Class Button (if authenticated) */}
            {isEditorAuthenticated && onDeleteClass && (
              <button
                type="button"
                onClick={onDeleteClass}
                className="text-stone-300 hover:text-red-300 p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title="このクラス調書を削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Info Banner - 表示のみ（コピー不可） */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-300 shadow-2xs relative overflow-hidden select-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3 mb-3">
              <div>
                <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider block">
                  CLASS CLASSIFICATION
                </span>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-detective-title text-stone-950">
                    {c.name}
                  </h1>
                  <span className="text-xs sm:text-sm text-stone-500 font-serif italic">
                    — {c.alias}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs px-2.5 py-1 rounded bg-stone-100 text-stone-700 border border-stone-300 font-serif flex items-center gap-1.5">
                  <Book className="w-3.5 h-3.5 text-stone-500" />
                  <span>出典: {c.sourceBook}</span>
                </span>
              </div>
            </div>

            {/* Confidential Stamp Graphic */}
            <div className="absolute right-3 top-3 pointer-events-none opacity-20 sm:opacity-30 rotate-[-8deg]">
              <div className="border-4 border-red-700 text-red-800 px-3 py-1 font-mono font-bold text-xs tracking-widest uppercase rounded">
                CLASSIFIED DOSSIER
              </div>
            </div>
          </div>

          {/* コピー可能対象のご案内バー */}
          <div className="px-3.5 py-2 bg-amber-50/80 rounded-lg border border-amber-200/90 text-[11px] text-amber-950 font-serif flex items-center justify-between gap-2 select-none shadow-2xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
              <span>
                <strong>コピー可能エリア:</strong> 本調書では<strong>「背景表」</strong>および<strong>「自動取得アクション（アクション名／タイプ／コスト／内容を個別コピー可）」</strong>のみコピーできます。
              </span>
            </span>
            <span className="text-amber-800/80 hidden sm:inline text-[10px] shrink-0">
              ※修得技能・フレーバー等の他項目はコピー対象外
            </span>
          </div>

          {/* 修得技能 (Skills Acquired) - 表示のみ（コピー不可） */}
          {c.skillsAcquired && (
            <div className="p-4 bg-stone-100/90 border border-stone-300 rounded-xl flex items-start gap-3 shadow-2xs select-none">
              <div className="p-2 bg-amber-900/10 rounded-lg text-amber-900 shrink-0 mt-0.5">
                <GraduationCap className="w-5 h-5 text-amber-800" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs font-bold font-serif text-stone-900 block">
                    修得技能（キャラクター作成時の技能指定）
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">表示専用</span>
                </div>
                <p className="text-xs sm:text-sm font-serif text-stone-800 leading-relaxed">
                  {c.skillsAcquired}
                </p>
              </div>
            </div>
          )}

          {/* フレーバーテキスト・人物像解説 - 表示のみ（コピー不可） */}
          {c.description && (
            <div className="bg-amber-50/70 p-4 sm:p-5 rounded-xl border border-amber-300/80 text-xs sm:text-sm text-stone-800 font-serif leading-relaxed shadow-2xs select-none">
              <div className="font-bold text-amber-950 mb-1.5 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-800" />
                  <span>フレーバーテキスト・クラス解説</span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono font-normal">表示専用</span>
              </div>
              <p className="whitespace-pre-line leading-relaxed">{c.description}</p>
            </div>
          )}

          {/* クラス背景・設定一覧 セクション（コピー可能） */}
          {c.backgroundTable && c.backgroundTable.length > 0 && (
            <div className="border-2 border-stone-300 rounded-xl p-4 sm:p-5 bg-stone-100/80 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-stone-300">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-800" />
                  <h3 className="text-sm sm:text-base font-bold font-detective-title text-stone-950">
                    {c.name} 背景表（{c.role === '助手' || c.backgroundTable.length === 6 ? '1D6' : '1D10'}・全{c.backgroundTable.length}種）
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyFullBackgrounds}
                    className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700 text-xs font-serif flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="背景表を全行一括コピー"
                  >
                    {lastCopiedKey === 'bg-all' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>背景表一括コピー</span>
                  </button>
                  <span className="text-[11px] text-stone-500 font-serif hidden sm:inline">
                    ※各行をクリックで単体コピー
                  </span>
                </div>
              </div>

              {/* 背景一覧リスト */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {c.backgroundTable.map((item) => (
                  <div
                    key={item.roll}
                    onClick={() =>
                      copyText(
                        `【${item.roll}: ${item.title}】\n${item.description}`,
                        `${item.roll}: ${item.title}`,
                        `bg-item-${item.roll}`
                      )
                    }
                    className="p-3 rounded-lg border bg-white hover:bg-amber-50/50 border-stone-200 hover:border-amber-400 transition-all cursor-pointer group flex items-start gap-3 shadow-2xs"
                    title="クリックしてこの背景をコピー"
                  >
                    <span className="shrink-0 w-6 h-6 rounded bg-stone-800 text-amber-200 font-mono font-bold text-xs flex items-center justify-center mt-0.5">
                      {item.roll}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h5 className="text-xs sm:text-sm font-bold font-serif text-stone-950 group-hover:text-amber-900">
                          {item.title}
                        </h5>
                        <span className="text-[11px] text-stone-400 group-hover:text-amber-800 opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                          {lastCopiedKey === `bg-item-${item.roll}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          コピー
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 font-serif leading-relaxed whitespace-pre-line">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 【自動取得アクション セクション】（クラス調書のアクションは自動取得のみ） */}
          {/* ============================================================== */}
          <div className="space-y-3 pt-2 border-t-2 border-stone-300">
            <div className="flex items-center justify-between border-b-2 border-sky-600/70 pb-2 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowAutoSection(!showAutoSection)}
                className="flex items-center gap-2 text-left cursor-pointer group/auto"
              >
                <span className="p-1.5 rounded-lg bg-sky-900 text-sky-200 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-serif text-stone-950 group-hover/auto:text-sky-900 flex items-center gap-1.5">
                    <span>{c.name}（{c.role}）の自動取得アクション ({effectiveAutoActions.length}件)</span>
                    {showAutoSection ? (
                      <ChevronUp className="w-4 h-4 text-stone-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-500" />
                    )}
                  </h3>
                  <p className="text-[11px] text-stone-600 font-serif mt-0.5">
                    ※キャラクター作成時に{c.role}が無条件で自動修得する基本アクションです。
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-2">
                {isEditorAuthenticated && onUpdateClassAutoSkills && (
                  <button
                    type="button"
                    onClick={handleOpenAddAutoSkill}
                    className="px-3 py-1 bg-sky-800 hover:bg-sky-900 text-white rounded text-xs font-serif flex items-center gap-1 shadow-2xs cursor-pointer transition-colors font-bold"
                    title="自動取得アクションを手入力で追加"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>自動取得アクション追加</span>
                  </button>
                )}
                <span className="text-[11px] font-serif font-bold text-sky-950 bg-sky-100 px-2 py-0.5 rounded border border-sky-300 shrink-0">
                  {c.autoSkills && c.autoSkills.length > 0 ? 'クラス専用指定' : '役割共通・基本修得'}
                </span>
              </div>
            </div>

            {/* アクション手入力／編集フォーム（インライン） */}
            {isAddingAutoSkill && (
              <form
                onSubmit={handleSaveAutoSkillForm}
                className="p-4 rounded-xl space-y-3 shadow-md animate-in fade-in border-2 bg-sky-50/95 border-sky-600 text-stone-900"
              >
                <div className="flex items-center justify-between border-b pb-1.5 border-stone-300">
                  <h4 className="font-bold text-xs sm:text-sm flex items-center gap-1.5 text-stone-950">
                    <Sparkles className="w-4 h-4 text-sky-700" />
                    <span>
                      {editingAutoSkillItem
                        ? `自動取得アクション「${editingAutoSkillItem.name}」の編集`
                        : `新しい自動取得アクションを手入力で追加`}
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingAutoSkill(false);
                      setEditingAutoSkillItem(null);
                      setFormErrorMsg(null);
                    }}
                    className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {formErrorMsg && (
                  <div className="p-2.5 bg-red-100 border border-red-300 rounded text-xs text-red-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{formErrorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                      アクション名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={skillFormName}
                      onChange={(e) => setSkillFormName(e.target.value)}
                      placeholder="例: ひらめき, パートナーへの信頼, アシスト"
                      required
                      className="w-full p-2 bg-white border border-stone-300 rounded text-xs font-bold font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                      タイプ
                    </label>
                    <input
                      type="text"
                      value={skillFormType}
                      onChange={(e) => setSkillFormType(e.target.value)}
                      placeholder="例: 補助, 判定, 調査"
                      className="w-full p-2 bg-white border border-stone-300 rounded text-xs font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                      コスト
                    </label>
                    <input
                      type="text"
                      value={skillFormCost}
                      onChange={(e) => setSkillFormCost(e.target.value)}
                      placeholder="例: なし, 1, 余裕1"
                      className="w-full p-2 bg-white border border-stone-300 rounded text-xs font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                    効果・ルール内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={skillFormDesc}
                    onChange={(e) => setSkillFormDesc(e.target.value)}
                    placeholder="アクションの効果、判定方法、使用条件などを入力"
                    required
                    className="w-full p-2 bg-white border border-stone-300 rounded text-xs font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-600 leading-relaxed"
                  />
                </div>

                {/* フレーバー入力欄 */}
                <div className="bg-sky-100/70 p-2.5 rounded-lg border border-sky-300/80 space-y-1">
                  <label className="block text-[11px] font-bold text-sky-950 flex items-center gap-1">
                    <Quote className="w-3.5 h-3.5 text-sky-800" />
                    <span>フレーバーテキスト（演出・台詞・情景描写）</span>
                  </label>
                  <textarea
                    rows={2}
                    value={skillFormFlavor}
                    onChange={(e) => setSkillFormFlavor(e.target.value)}
                    placeholder="キャラクターの台詞、演出描写、フレーバーテキストを入力してください（例: 「私の灰色の脳細胞が告げている…」「相棒、君のおかげだ」）"
                    className="w-full p-2 bg-white border border-stone-300 rounded text-xs font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-600 italic leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-stone-300">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingAutoSkill(false);
                      setEditingAutoSkillItem(null);
                      setFormErrorMsg(null);
                    }}
                    className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded text-xs font-serif cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={savingSkill}
                    className="px-4 py-1 bg-sky-800 hover:bg-sky-900 text-white rounded text-xs font-serif font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingSkill ? '保存中…' : '調書に反映して保存'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* 自動取得アクション一覧カード */}
            {showAutoSection && (
              <div className="space-y-3">
                {effectiveAutoActions.length === 0 ? (
                  <div className="p-4 text-center bg-white rounded-xl border border-dashed border-sky-300 text-xs text-stone-600">
                    自動取得アクションが未登録です。「自動取得アクション追加」ボタンから登録できます。
                  </div>
                ) : (
                  effectiveAutoActions.map((sk) => (
                    <div
                      key={sk.id}
                      className="bg-white p-4 rounded-xl border-2 border-sky-200 shadow-2xs space-y-3 transition-colors relative"
                    >
                      {/* 1. Header Row: Action Name + Separate Action Name Copy + Edit/Delete/Full Copy */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-sky-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-900 text-sky-100 font-mono font-bold select-none">
                            自動取得
                          </span>
                          <h4 className="text-sm sm:text-base font-bold font-serif text-stone-950 flex items-center gap-1.5 select-text">
                            <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                            <span>{sk.name}</span>
                          </h4>
                          {/* Dedicated copy button for 「アクション名」 */}
                          <button
                            type="button"
                            onClick={() => copySkillName(sk)}
                            className="px-2 py-0.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-300 text-xs font-serif flex items-center gap-1 transition-colors cursor-pointer select-none"
                            title={`アクション名「${sk.name}」のみコピー`}
                          >
                            {lastCopiedKey === `name-${sk.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold text-[11px]">名前済</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-sky-700" />
                                <span className="text-[11px]">アクション名コピー</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-serif">
                          {isEditorAuthenticated && onUpdateClassAutoSkills && (
                            <div className="flex items-center gap-1">
                              {deletingSkillId === sk.id ? (
                                <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded border border-red-200">
                                  <span className="text-[10px] text-red-700 font-bold px-1">削除?</span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleConfirmDeleteAutoSkill(sk.id, e)}
                                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    はい
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingSkillId(null)}
                                    className="px-1.5 py-0.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded text-[10px] cursor-pointer"
                                  >
                                    中止
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditAutoSkill(sk, e)}
                                    className="p-1 text-sky-800 hover:text-sky-950 hover:bg-sky-100 rounded transition-colors cursor-pointer"
                                    title="この自動取得アクションを編集"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingSkillId(sk.id)}
                                    className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    title="この自動取得アクションを削除"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* 一括コピーボタン */}
                          <button
                            type="button"
                            onClick={() => copySkillFull(sk)}
                            className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-amber-200 rounded text-xs font-serif flex items-center gap-1 border border-stone-700 transition-colors cursor-pointer select-none"
                            title={`「${sk.name}」のすべて（名前・コスト・内容等）を一括コピー`}
                          >
                            {lastCopiedKey === `full-${sk.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300 font-bold text-[11px]">一括済</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-amber-300" />
                                <span className="text-[11px]">一括コピー</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 2. Type & Cost Row with Dedicated Type and Cost Copy */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Dedicated Type Badge & Copy */}
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-950 border border-sky-300 font-bold text-[11px] select-text">
                            タイプ: {sk.type || sk.timing || '補助'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copySkillType(sk)}
                            className="px-2 py-0.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 text-xs font-serif flex items-center gap-1 transition-colors cursor-pointer select-none"
                            title={`タイプ「${sk.type || sk.timing || '補助'}」のみコピー`}
                          >
                            {lastCopiedKey === `type-${sk.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold text-[11px]">タイプ済</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-sky-700" />
                                <span className="text-[11px]">タイプをコピー</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Dedicated Cost Badge & Copy */}
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-950 border border-purple-200 font-bold font-mono text-[11px] select-text">
                            コスト: {sk.cost || sk.target || 'なし'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copySkillCost(sk)}
                            className="px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 text-xs font-serif flex items-center gap-1 transition-colors cursor-pointer select-none"
                            title={`コスト「${sk.cost || sk.target || 'なし'}」のみコピー`}
                          >
                            {lastCopiedKey === `cost-${sk.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold text-[11px]">コスト済</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-purple-700" />
                                <span className="text-[11px]">コストをコピー</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 3. Description (効果・ルール内容) with Dedicated Description Copy */}
                      <div className="bg-stone-50/80 p-3 rounded-lg border border-stone-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-stone-700 font-serif flex items-center gap-1 select-none">
                            <span>効果・内容（ルール詳細）</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => copySkillDesc(sk)}
                            className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-serif flex items-center gap-1 transition-colors cursor-pointer select-none"
                            title={`「${sk.name}」の効果・内容のみをコピー`}
                          >
                            {lastCopiedKey === `desc-${sk.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold text-[11px]">内容済</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-amber-700" />
                                <span className="text-[11px]">内容をコピー</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-stone-800 font-serif leading-relaxed whitespace-pre-line select-text">
                          {sk.description}
                        </p>
                      </div>

                      {/* 4. フレーバーテキスト（演出・台詞・描写） */}
                      {sk.flavor ? (
                        <div className="text-xs text-sky-950 font-serif italic bg-sky-50/80 p-2.5 rounded-lg border border-sky-200/80 flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <Quote className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5 rotate-180 select-none" />
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-sky-800 not-italic block uppercase tracking-wider mb-0.5 select-none">
                                フレーバー:
                              </span>
                              <span className="select-text">{sk.flavor}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => copySkillFlavor(sk)}
                            className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 text-[11px] font-serif flex items-center gap-1 shrink-0 transition-colors cursor-pointer select-none"
                            title="フレーバーテキストのみコピー"
                          >
                            {lastCopiedKey === `flavor-${sk.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-sky-700" />
                            )}
                            <span>フレーバーコピー</span>
                          </button>
                        </div>
                      ) : (
                        isEditorAuthenticated && onUpdateClassAutoSkills && (
                          <div className="text-[11px] text-stone-400 font-serif italic flex items-center gap-1 pt-0.5 select-none">
                            <Quote className="w-3 h-3 opacity-40" />
                            <span>フレーバー未設定（上の編集ボタンから追加できます）</span>
                          </div>
                        )
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
