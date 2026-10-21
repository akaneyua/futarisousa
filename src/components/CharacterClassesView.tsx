import React, { useState, useMemo } from 'react';
import {
  CharacterClass,
  CharacterRole,
  SkillRole,
  CharacterSkill,
  SituationInvestigation
} from '../types.ts';
import { ALL_CHARACTER_CLASSES, ALL_CHARACTER_SKILLS, AUTOMATIC_ACTIONS } from '../characterData.ts';
import { ClassCard } from './ClassCard.tsx';
import { ClassDetail } from './ClassDetail.tsx';
import { EditClassModal } from './EditClassModal.tsx';
import { EditSkillModal } from './EditSkillModal.tsx';
import {
  Search,
  Plus,
  Edit3,
  RotateCcw,
  Copy,
  Check,
  ClipboardCheck,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Shield,
  Filter,
  X
} from 'lucide-react';

interface CharacterClassesViewProps {
  situations?: SituationInvestigation[];
  characterClasses?: CharacterClass[];
  signatureSkills?: CharacterSkill[];
  autoSkills?: CharacterSkill[];
  onSelectSituation?: (situation: SituationInvestigation) => void;
  onBackToSituations?: () => void;
  viewTab: 'classes' | 'skills' | 'auto-skills';
  onSwitchToTab?: (tab: 'classes' | 'skills' | 'auto-skills') => void;
  onSwitchToClasses?: (classId?: string) => void;
  selectedClassId?: string | null;
  onSelectClassId?: (id: string | null) => void;
  onSaveClass?: (classData: CharacterClass) => Promise<void>;
  onDeleteClass?: (classId: string) => Promise<void>;
  onResetClasses?: () => Promise<void>;
  onSaveSkill?: (skill: CharacterSkill) => Promise<void>;
  onDeleteSkill?: (skillId: string) => Promise<void>;
  onResetSkills?: () => Promise<void>;
  onSaveAutoSkill?: (skill: CharacterSkill) => Promise<void>;
  onDeleteAutoSkill?: (skillId: string) => Promise<void>;
  onResetAutoSkills?: () => Promise<void>;
  isEditorAuthenticated?: boolean;
  passkey?: string;
}

export const CharacterClassesView: React.FC<CharacterClassesViewProps> = ({
  characterClasses,
  signatureSkills: externalSignatureSkills,
  autoSkills: externalAutoSkills = [],
  viewTab,
  onSwitchToTab,
  onSwitchToClasses,
  selectedClassId: externalSelectedClassId,
  onSelectClassId,
  onSaveClass,
  onDeleteClass,
  onResetClasses,
  onSaveSkill,
  onDeleteSkill,
  onResetSkills,
  onSaveAutoSkill,
  onDeleteAutoSkill,
  onResetAutoSkills,
  isEditorAuthenticated = false,
  passkey = '',
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedSkillType, setSelectedSkillType] = useState<string>('ALL');
  const [selectedSkillCost, setSelectedSkillCost] = useState<string>('ALL');
  const [internalSelectedClassId, setInternalSelectedClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom in-app Confirmation Dialog (replaces window.confirm to avoid iframe freezes)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Modals for editing
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<CharacterClass | null>(null);

  const [isEditSkillModalOpen, setIsEditSkillModalOpen] = useState<boolean>(false);
  const [editingSkill, setEditingSkill] = useState<CharacterSkill | null>(null);
  const [editingSkillCategory, setEditingSkillCategory] = useState<'固有' | '自動取得'>('固有');

  const classesList = characterClasses !== undefined ? characterClasses : [];
  
  // 固有アクションリスト：外部から渡されたもの（空配列の場合はそのまま空）
  const skillsList = externalSignatureSkills !== undefined
    ? externalSignatureSkills
    : [];

  // 自動取得アクションリスト
  const autoSkillsList = useMemo(() => {
    return externalAutoSkills !== undefined
      ? externalAutoSkills
      : [];
  }, [externalAutoSkills]);

  // Current selected class for modal window
  const activeClassId = externalSelectedClassId !== undefined ? externalSelectedClassId : internalSelectedClassId;
  const selectedClass = useMemo(() => {
    if (!activeClassId) return null;
    return classesList.find((c) => c.id === activeClassId) || null;
  }, [classesList, activeClassId]);

  const handleSelectClass = (id: string) => {
    if (onSelectClassId) {
      onSelectClassId(id);
    } else {
      setInternalSelectedClassId(id);
    }
  };

  const handleCloseClass = () => {
    if (onSelectClassId) {
      onSelectClassId(null);
    } else {
      setInternalSelectedClassId(null);
    }
  };

  const copyText = (text: string, label: string, key?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (key) setCopiedId(key);
    setCopyToast(`「${label}」をコピーしました`);
    setTimeout(() => {
      setCopyToast((prev) => (prev?.includes(label) ? null : prev));
      if (key) setCopiedId(null);
    }, 2200);
  };

  // 名前だけをコピー
  const copySkillName = (sk: CharacterSkill, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    copyText(sk.name, `アクション名: ${sk.name}`, `name-${sk.id}`);
  };

  // タイプだけをコピー
  const copySkillType = (sk: CharacterSkill, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const typeVal = sk.type || sk.timing || '補助';
    copyText(typeVal, `タイプ: ${typeVal}`, `type-${sk.id}`);
  };

  // コストだけをコピー
  const copySkillCost = (sk: CharacterSkill, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const costVal = sk.cost || sk.target || 'なし';
    copyText(costVal, `コスト: ${costVal}`, `cost-${sk.id}`);
  };

  // 内容（効果）だけをコピー
  const copySkillDesc = (sk: CharacterSkill, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    copyText(sk.description, `${sk.name}の内容`, `desc-${sk.id}`);
  };

  // アクション全体を一括コピー: 【題名】\nタイプ / コスト\n内容
  const copySkillFull = (sk: CharacterSkill, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const formatted = `【${sk.name}】\nタイプ: ${sk.type || sk.timing || '補助'} / コスト: ${sk.cost || sk.target || 'なし'}\n${sk.description}`;
    copyText(formatted, `${sk.name} 一括`, `full-${sk.id}`);
  };

  const copySkill = copySkillFull;

  // タイプ（Type）フィルター選択肢：「すべて」「補助」「常駐」を優先し、データ中のタイプも網羅
  const typeFilterOptions = useMemo(() => {
    const list = skillsList;
    const types = new Set<string>();
    list.forEach((s) => {
      const t = (s.type || s.timing || '').trim();
      if (t) types.add(t);
    });
    const priority = ['補助', '常駐'];
    const others = Array.from(types).filter((t) => !priority.includes(t)).sort();
    return ['ALL', ...priority, ...others];
  }, [skillsList]);

  // コスト（Cost）フィルター選択肢：「すべて」「なし」「1」「2」「3」「4」「5」「6」
  const costFilterOptions = useMemo(() => {
    return ['ALL', 'なし', '1', '2', '3', '4', '5', '6'];
  }, []);

  // タイプ合致判定
  const matchSkillType = (typeVal: string | undefined, targetType: string) => {
    if (targetType === 'ALL') return true;
    const t = (typeVal || '').trim();
    if (targetType === '常駐') {
      return t === '常駐' || t === '常時' || t.includes('常駐');
    }
    if (targetType === '補助') {
      return t === '補助' || t.includes('補助');
    }
    return t.toLowerCase() === targetType.toLowerCase() || t.includes(targetType);
  };

  // コスト合致判定（「なし」または「1」〜「6」の余裕消費）
  const matchSkillCost = (costVal: string | undefined, targetCost: string) => {
    if (targetCost === 'ALL') return true;
    const c = (costVal || '').trim();
    if (targetCost === 'なし') {
      return c === 'なし' || c === '' || c === '0' || c === '-' || c.includes('なし');
    }
    // targetCost is '1', '2', '3', '4', '5', '6'
    if (c === targetCost) return true;
    if (c === `余裕${targetCost}` || c === `コスト${targetCost}` || c === `${targetCost}点`) return true;
    // Word/digit boundary match
    const regex = new RegExp(`(^|[^0-9])${targetCost}([^0-9]|$)`);
    return regex.test(c);
  };

  const isSkillFilterActive =
    selectedRole !== 'ALL' ||
    selectedSkillType !== 'ALL' ||
    selectedSkillCost !== 'ALL' ||
    searchQuery.trim() !== '';

  const handleResetSkillFilters = () => {
    setSelectedRole('ALL');
    setSelectedSkillType('ALL');
    setSelectedSkillCost('ALL');
    setSearchQuery('');
  };

  // Filter classes
  const filteredClasses = useMemo(() => {
    return classesList.filter((c) => {
      if (selectedRole !== 'ALL' && c.role !== selectedRole) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchAlias = (c.alias || '').toLowerCase().includes(q);
        const matchSkillsAcquired = (c.skillsAcquired || '').toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        const matchBook = (c.sourceBook || '').toLowerCase().includes(q);
        const matchBackground = (c.backgroundTable || []).some(
          (b) =>
            (b.title || '').toLowerCase().includes(q) ||
            (b.description || '').toLowerCase().includes(q)
        );
        return (
          matchName ||
          matchAlias ||
          matchSkillsAcquired ||
          matchDesc ||
          matchBook ||
          matchBackground
        );
      }
      return true;
    });
  }, [classesList, selectedRole, searchQuery]);

  // Filter signature skills: 固有アクションのみ厳密に対象（自動修得アクションは含めない）
  const filteredSkills = useMemo(() => {
    const list = skillsList.filter((s) => s.category !== '自動取得' && !s.id.startsWith('auto-'));
    return list.filter((s) => {
      if (selectedRole !== 'ALL' && s.role !== selectedRole) return false;
      if (!matchSkillType(s.type || s.timing, selectedSkillType)) return false;
      if (!matchSkillCost(s.cost || s.target, selectedSkillCost)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchDesc = (s.description || '').toLowerCase().includes(q);
        const matchType = (s.type || s.timing || '').toLowerCase().includes(q);
        const matchCost = (s.cost || s.target || '').toLowerCase().includes(q);
        const matchRole = (s.role || '').toLowerCase().includes(q);
        const matchCat = (s.category || '').toLowerCase().includes(q);
        const matchFlavor = (s.flavor || '').toLowerCase().includes(q);
        return matchName || matchDesc || matchType || matchCost || matchRole || matchCat || matchFlavor;
      }
      return true;
    });
  }, [skillsList, selectedRole, selectedSkillType, selectedSkillCost, searchQuery]);

  // Filter automatic skills: 専用タブで表示する自動取得アクションリスト
  const filteredAutoSkills = useMemo(() => {
    return autoSkillsList.filter((s) => {
      if (selectedRole !== 'ALL' && s.role !== selectedRole) return false;
      if (!matchSkillType(s.type || s.timing, selectedSkillType)) return false;
      if (!matchSkillCost(s.cost || s.target, selectedSkillCost)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchDesc = (s.description || '').toLowerCase().includes(q);
        const matchType = (s.type || s.timing || '').toLowerCase().includes(q);
        const matchCost = (s.cost || s.target || '').toLowerCase().includes(q);
        const matchRole = (s.role || '').toLowerCase().includes(q);
        const matchFlavor = (s.flavor || '').toLowerCase().includes(q);
        return matchName || matchDesc || matchType || matchCost || matchRole || matchFlavor;
      }
      return true;
    });
  }, [autoSkillsList, selectedRole, selectedSkillType, selectedSkillCost, searchQuery]);

  const handleDeleteClassConfirm = (c: CharacterClass) => {
    if (!onDeleteClass) return;
    setConfirmDialog({
      title: `クラス「${c.name}」の削除`,
      message: `クラス「${c.name}」を完全に削除してもよろしいですか？この操作は取り消せません。`,
      confirmLabel: '削除する',
      isDanger: true,
      onConfirm: async () => {
        await onDeleteClass(c.id);
        handleCloseClass();
      }
    });
  };

  const handleResetClassesConfirm = () => {
    if (!onResetClasses) return;
    setConfirmDialog({
      title: 'クラス調書の初期化',
      message: 'クラス調書データを初期状態に復元しますか？（追加・編集した内容は元に戻ります）',
      confirmLabel: '初期状態に復元',
      isDanger: true,
      onConfirm: async () => {
        await onResetClasses();
      }
    });
  };

  const handleResetSkillsConfirm = () => {
    if (!onResetSkills) return;
    setConfirmDialog({
      title: '固有アクションデータの初期化',
      message: '固有アクションデータを初期状態に復元しますか？（追加・編集した内容は元に戻ります）',
      confirmLabel: '初期状態に復元',
      isDanger: true,
      onConfirm: async () => {
        await onResetSkills();
      }
    });
  };

  const handleResetAutoSkillsConfirm = () => {
    if (!onResetAutoSkills) return;
    setConfirmDialog({
      title: '自動修得アクションデータの初期化',
      message: '自動修得アクションデータを初期状態に復元しますか？（追加・編集した内容は元に戻ります）',
      confirmLabel: '初期状態に復元',
      isDanger: true,
      onConfirm: async () => {
        await onResetAutoSkills();
      }
    });
  };

  const getRoleTagClass = (role: string) => {
    switch (role) {
      case '探偵':
        return 'bg-amber-900 text-amber-100 border-amber-700';
      case '助手':
        return 'bg-teal-900 text-teal-100 border-teal-700';
      case 'フタリ':
        return 'bg-rose-900 text-rose-100 border-rose-700';
      case 'ゲスト':
        return 'bg-purple-900 text-purple-100 border-purple-700';
      case '刑事':
        return 'bg-indigo-900 text-indigo-100 border-indigo-700';
      default:
        return 'bg-stone-800 text-stone-100 border-stone-600';
    }
  };

  const roleFilterOptions = useMemo(() => {
    return viewTab === 'classes'
      ? ['ALL', '探偵', '助手', '刑事']
      : ['ALL', '探偵', '助手', 'フタリ', 'ゲスト'];
  }, [viewTab]);

  return (
    <div id="character-classes-view" className="space-y-4 font-serif">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900/95 text-amber-100 text-xs font-serif px-4 py-2.5 rounded-lg shadow-xl border border-amber-800/80 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <ClipboardCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Header Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Section Description */}
          <div>
            <h2 className="text-base sm:text-lg font-bold font-detective-title text-stone-900 flex items-center gap-2">
              {viewTab === 'classes' ? (
                <>
                  <Sparkles className="w-5 h-5 text-amber-800" />
                  <span>クラス調書（基本アクション修得・背景表）</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-amber-700" />
                  <span>固有アクション一覧（探偵・助手・フタリ・ゲストの特有アクション）</span>
                </>
              )}
            </h2>
            <p className="text-xs text-stone-500 font-serif mt-0.5">
              {viewTab === 'classes'
                ? '探偵・助手・刑事の各クラス調書。クリックで自動取得アクションや背景表（探偵1D10・助手1D6）を閲覧・コピーできます。'
                : '役割（探偵・助手・フタリ・ゲスト）ごとの固有アクションです（自動取得アクションとは完全に別枠です。クラス非依存で修得可能）。'}
            </p>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-stone-100 text-stone-700 border border-stone-200">
              {viewTab === 'classes' ? `全${classesList.length}クラス` : `全${skillsList.length}アクション`}
            </span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Filter Tabs */}
            <span className="text-xs font-bold text-stone-600">役割:</span>
            <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-serif flex-wrap gap-0.5">
              {roleFilterOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    selectedRole === r
                      ? 'bg-amber-900 text-amber-100 font-bold shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {r === 'ALL' ? 'すべて' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                viewTab === 'classes'
                  ? 'クラス名、通称、技能、背景等で検索…'
                  : 'アクション名、タイプ、コスト、効果等で検索…'
              }
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-serif text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-700"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Add Class Button in Classes view */}
          {viewTab === 'classes' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingClass(null);
                  setIsEditClassModalOpen(true);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs font-serif flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>＋ クラス新規作成</span>
              </button>
            </div>
          )}

          {/* Add Skill Button in Skills / Auto-skills view */}
          {viewTab !== 'classes' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingSkill(null);
                  setEditingSkillCategory('固有');
                  setIsEditSkillModalOpen(true);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs font-serif flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>＋ 固有アクション作成</span>
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Type & Cost Filter Bar for Actions (固有・自動取得アクション一覧時) */}
        {viewTab !== 'classes' && (
          <div className="pt-2.5 border-t border-stone-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs font-serif">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Type Filter: 「補助」「常駐」など */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-stone-700 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-amber-700" />
                  <span>タイプ:</span>
                </span>
                <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 gap-1 flex-wrap">
                  {typeFilterOptions.map((t) => {
                    const isSelected = selectedSkillType === t;
                    let selectedClass = 'bg-stone-800 text-stone-100 font-bold shadow-2xs';
                    if (t === '補助') {
                      selectedClass = 'bg-amber-800 text-amber-100 border border-amber-600 font-bold shadow-2xs';
                    } else if (t === '常駐') {
                      selectedClass = 'bg-emerald-800 text-emerald-100 border border-emerald-600 font-bold shadow-2xs';
                    }
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedSkillType(t)}
                        className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                          isSelected
                            ? selectedClass
                            : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/70'
                        }`}
                      >
                        {t === 'ALL' ? 'すべて' : t === '補助' ? '⚡ 補助' : t === '常駐' ? '🛡️ 常駐' : t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cost Filter: 「なし」「1」〜「6」 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-stone-700 flex items-center gap-1">
                  <span>コスト:</span>
                </span>
                <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 gap-0.5 flex-wrap font-mono">
                  {costFilterOptions.map((c) => {
                    const isSelected = selectedSkillCost === c;
                    let selectedClass = 'bg-stone-800 text-stone-100 font-bold shadow-2xs';
                    if (c === 'なし') {
                      selectedClass = 'bg-stone-700 text-stone-100 font-bold shadow-2xs';
                    } else if (c !== 'ALL') {
                      selectedClass = 'bg-purple-800 text-purple-100 border border-purple-600 font-bold shadow-2xs';
                    }
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedSkillCost(c)}
                        className={`px-2.5 py-0.5 rounded text-xs transition-all cursor-pointer ${
                          isSelected
                            ? selectedClass
                            : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/70'
                        }`}
                      >
                        {c === 'ALL' ? 'すべて' : c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Filters Clear Button & Result Count */}
            {isSkillFilterActive && (
              <div className="flex items-center gap-2 self-end lg:self-auto shrink-0 flex-wrap">
                <span className="text-[11px] text-stone-500 font-serif">
                  絞込結果: <strong className="text-amber-900 font-bold">{filteredSkills.length}</strong> 件
                </span>
                <button
                  type="button"
                  onClick={handleResetSkillFilters}
                  className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-md text-xs font-serif flex items-center gap-1 transition-colors cursor-pointer border border-stone-300"
                  title="すべての検索・フィルター条件をクリア"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>条件をリセット</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {viewTab === 'classes' ? (
        /* Classes Grid View: Click any card to open the class detail in a modal window */
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <span className="text-xs font-bold font-serif text-stone-700">
              クラス調書一覧 ({filteredClasses.length}件)
            </span>
            <span className="text-xs font-serif text-stone-500">
              クリックすると調書が窓（モーダル）で開きます（自動取得アクション・背景表を掲載）
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((c) => (
              <ClassCard
                key={c.id}
                characterClass={c}
                isSelected={selectedClass?.id === c.id}
                onClick={() => handleSelectClass(c.id)}
              />
            ))}
          </div>

          {filteredClasses.length === 0 && (
            <div className="text-center py-12 px-4 bg-white rounded-xl border border-stone-200 text-stone-600 text-xs font-serif space-y-3">
              <Sparkles className="w-8 h-8 mx-auto text-amber-700/60" />
              <p className="text-sm text-stone-900 font-bold">
                {classesList.length === 0
                  ? 'クラス調書はまだ登録されていません（まっさらな状態です）'
                  : '該当するクラスが見つかりません'}
              </p>
              <p className="text-stone-500 max-w-md mx-auto">
                {classesList.length === 0
                  ? '「＋ クラス新規作成」ボタンから独自のクラスを登録してください。'
                  : '検索語句や役割フィルターを変更してお試しください。'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setEditingClass(null);
                    setIsEditClassModalOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold rounded-lg text-xs font-serif flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>＋ クラス新規作成</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Skills Views: 固有アクション一覧（自動取得アクションは含めない） */
        <div className="space-y-4">
          {/* Section Title Header */}
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <div className="text-xs font-bold font-serif text-stone-700 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-700" />
              <span>固有アクション一覧 ({filteredSkills.length}件)</span>
              <span className="text-[11px] font-normal text-stone-500">
                ※クラス非依存・役割ごとに修得可能な固有アクション
              </span>
            </div>

            <div className="text-[11px] font-serif text-stone-500">
              全{filteredSkills.length}件表示中（名前・タイプ・コスト・内容を個別コピー可能）
            </div>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map((sk) => {
              const isAutoAction = false;
              return (
                <div
                  key={sk.id}
                  className="bg-white p-4 rounded-xl border border-stone-300 shadow-2xs space-y-3 transition-colors"
                >
                  {/* Header Row: Role, Category, Name + Name Copy Button + Editor/Full Copy */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-1.5 border-b border-stone-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-serif select-none ${getRoleTagClass(
                          sk.role
                        )}`}
                      >
                        {sk.role}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border select-none ${
                          isAutoAction
                            ? 'bg-sky-100 text-sky-900 border-sky-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {isAutoAction ? '自動取得' : '固有'}
                      </span>
                      <h4 className="text-sm font-bold font-serif text-stone-950 flex items-center gap-1 select-text">
                        {isAutoAction ? (
                          <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>{sk.name}</span>
                      </h4>

                      {/* Dedicated Name Copy Button */}
                      <button
                        type="button"
                        onClick={(e) => copySkillName(sk, e)}
                        className="px-2 py-0.5 rounded bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-950 border border-stone-300 text-[11px] font-serif flex items-center gap-1 transition-colors cursor-pointer select-none"
                        title={`アクション名「${sk.name}」のみコピー`}
                      >
                        {copiedId === `name-${sk.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">名前済</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-stone-500" />
                            <span>名前コピー</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isEditorAuthenticated && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSkill(sk);
                            setEditingSkillCategory(isAutoAction ? '自動取得' : '固有');
                            setIsEditSkillModalOpen(true);
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-serif flex items-center gap-1 transition-colors cursor-pointer select-none ${
                            isAutoAction
                              ? 'bg-sky-100 hover:bg-sky-200 text-sky-900'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          編集
                        </button>
                      )}

                      {/* Full Copy Button */}
                      <button
                        type="button"
                        onClick={(e) => copySkillFull(sk, e)}
                        className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-amber-200 rounded text-[11px] font-serif flex items-center gap-1 border border-stone-700 transition-colors cursor-pointer select-none"
                        title="アクション全体を一括コピー"
                      >
                        {copiedId === `full-${sk.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">一括済</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-amber-300" />
                            <span>一括コピー</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Type and Cost Row: Interactive Badges + Dedicated Copy Buttons */}
                  <div className="flex items-center gap-3 text-[11px] font-serif flex-wrap">
                    {/* Type & Type Copy */}
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded font-bold border bg-sky-50 text-sky-900 border-sky-300 select-text">
                        タイプ: {sk.type || sk.timing || '補助'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => copySkillType(sk, e)}
                        className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-sky-100 text-stone-700 hover:text-sky-900 border border-stone-300 transition-colors cursor-pointer flex items-center gap-1 select-none"
                        title={`タイプ「${sk.type || sk.timing || '補助'}」のみコピー`}
                      >
                        {copiedId === `type-${sk.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">タイプ済</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-sky-700" />
                            <span>タイプコピー</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Cost & Cost Copy */}
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded font-bold font-mono border bg-purple-50 text-purple-900 border-purple-300 select-text">
                        コスト: {sk.cost || sk.target || 'なし'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => copySkillCost(sk, e)}
                        className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-purple-100 text-stone-700 hover:text-purple-900 border border-stone-300 transition-colors cursor-pointer flex items-center gap-1 select-none"
                        title={`コスト「${sk.cost || sk.target || 'なし'}」のみコピー`}
                      >
                        {copiedId === `cost-${sk.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">コスト済</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-purple-700" />
                            <span>コストコピー</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Content (Description) Box with Dedicated Content Copy Button */}
                  <div className="bg-stone-50/80 p-2.5 rounded-lg border border-stone-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-600 font-serif select-none">
                        効果・ルール内容:
                      </span>
                      <button
                        type="button"
                        onClick={(e) => copySkillDesc(sk, e)}
                        className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-serif flex items-center gap-1 transition-colors cursor-pointer select-none"
                        title={`「${sk.name}」の効果・内容のみコピー`}
                      >
                        {copiedId === `desc-${sk.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">内容済</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-amber-700" />
                            <span>内容コピー</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-stone-800 font-serif leading-relaxed select-text whitespace-pre-line">
                      {sk.description}
                    </p>
                  </div>

                  {sk.flavor && (
                    <div className="text-[11px] text-stone-600 font-serif italic bg-stone-50 p-2 rounded border border-stone-200 select-text">
                      {sk.flavor}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredSkills.length === 0 && (
            <div className="text-center py-12 px-4 bg-white rounded-xl border border-stone-200 text-stone-600 text-xs font-serif space-y-3">
              <Zap className="w-8 h-8 mx-auto text-amber-700/60" />
              <p className="text-stone-900 font-bold text-sm">
                {skillsList.length === 0
                  ? '固有アクションはまだ登録されていません（まっさらな状態です）'
                  : '該当する固有アクションが見つかりません'}
              </p>
              <p className="text-stone-500 max-w-md mx-auto">
                {skillsList.length === 0
                  ? '「＋ 固有アクション作成」ボタンから新しいアクションを登録できます。'
                  : '役割、タイプ（補助・常駐）、コスト、または検索語句の条件を変更してお試しください。'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSkill(null);
                    setEditingSkillCategory('固有');
                    setIsEditSkillModalOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold rounded-lg text-xs font-serif flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>＋ 固有アクション作成</span>
                </button>
                {isSkillFilterActive && (
                  <button
                    type="button"
                    onClick={handleResetSkillFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-lg text-xs font-serif transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>条件をリセット</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Class Detail Modal Window (シチュエーション調査表と同様の窓で表示) */}
      {selectedClass && (
        <ClassDetail
          characterClass={selectedClass}
          onClose={handleCloseClass}
          onOpenEdit={() => {
            setEditingClass(selectedClass);
            setIsEditClassModalOpen(true);
          }}
          onDeleteClass={() => handleDeleteClassConfirm(selectedClass)}
          isEditorAuthenticated={isEditorAuthenticated}
          availableAutoSkills={externalAutoSkills}
          onUpdateClassAutoSkills={async (classId, newAutoSkills) => {
            if (onSaveClass) {
              const target = classesList.find((c) => c.id === classId);
              if (target) {
                await onSaveClass({
                  ...target,
                  autoSkills: newAutoSkills,
                });
              }
            }
          }}
        />
      )}

      {/* Class Edit / Create Modal */}
      {isEditClassModalOpen && (
        <EditClassModal
          characterClass={editingClass}
          onClose={() => {
            setIsEditClassModalOpen(false);
            setEditingClass(null);
          }}
          onSave={async (savedClass) => {
            if (onSaveClass) {
              await onSaveClass(savedClass);
            }
          }}
          passkey={passkey}
          availableAutoSkills={externalAutoSkills}
        />
      )}

      {/* Skill Edit / Create Modal (固有アクション・自動取得アクション両対応) */}
      {isEditSkillModalOpen && (
        <EditSkillModal
          skill={editingSkill}
          defaultCategory={editingSkillCategory}
          onClose={() => {
            setIsEditSkillModalOpen(false);
            setEditingSkill(null);
          }}
          onSave={async (savedSkill, migrationMeta) => {
            if (migrationMeta?.previousCategory === '自動取得' && savedSkill.category === '固有') {
              // Migrated from auto to signature
              if (migrationMeta.previousId && onDeleteAutoSkill) {
                await onDeleteAutoSkill(migrationMeta.previousId);
              }
              if (onSaveSkill) {
                await onSaveSkill(savedSkill);
              }
            } else if (migrationMeta?.previousCategory === '固有' && savedSkill.category === '自動取得') {
              // Migrated from signature to auto
              if (migrationMeta.previousId && onDeleteSkill) {
                await onDeleteSkill(migrationMeta.previousId);
              }
              if (onSaveAutoSkill) {
                await onSaveAutoSkill(savedSkill);
              }
            } else if (savedSkill.category === '自動取得' && onSaveAutoSkill) {
              await onSaveAutoSkill(savedSkill);
            } else if (onSaveSkill) {
              await onSaveSkill(savedSkill);
            }
          }}
          onDelete={async (skillId) => {
            if (editingSkillCategory === '自動取得' && onDeleteAutoSkill) {
              await onDeleteAutoSkill(skillId);
            } else if (onDeleteSkill) {
              await onDeleteSkill(skillId);
            }
          }}
          passkey={passkey}
        />
      )}

      {/* Custom Confirmation Modal (Replaces window.confirm) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border-2 border-stone-800">
            <h3 className="text-base font-bold font-detective-title text-stone-950">
              {confirmDialog.title}
            </h3>
            <p className="text-xs sm:text-sm font-serif text-stone-700 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded text-xs font-serif cursor-pointer transition-colors"
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
                className={`px-4 py-1.5 rounded text-xs font-serif font-bold text-white shadow-xs cursor-pointer transition-colors ${
                  confirmDialog.isDanger
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-amber-900 hover:bg-amber-800'
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
