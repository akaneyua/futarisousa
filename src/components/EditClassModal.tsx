import React, { useState } from 'react';
import { CharacterClass, CharacterRole, CharacterSkill, BackgroundTableItem } from '../types.ts';
import {
  X,
  Save,
  AlertCircle,
  RotateCcw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Quote
} from 'lucide-react';

interface EditClassModalProps {
  characterClass: CharacterClass | null; // null for new class
  onClose: () => void;
  onSave: (savedClass: CharacterClass) => Promise<void>;
  passkey: string;
  availableAutoSkills?: CharacterSkill[];
}

export const EditClassModal: React.FC<EditClassModalProps> = ({
  characterClass,
  onClose,
  onSave,
  availableAutoSkills = []
}) => {
  const isNew = !characterClass || !characterClass.id;

  const [name, setName] = useState(characterClass?.name || '');
  const [role, setRole] = useState<CharacterRole>(characterClass?.role || '探偵');
  const [alias, setAlias] = useState(characterClass?.alias || '');
  const [sourceBook, setSourceBook] = useState(
    characterClass?.sourceBook || '基本ルールブック'
  );
  const [skillsAcquired, setSkillsAcquired] = useState(characterClass?.skillsAcquired || '');
  const [description, setDescription] = useState(characterClass?.description || '');

  // 自動取得アクションの状態（クラス調書のアクションは自動取得のみ）
  const roleDefaultAutoSkills = availableAutoSkills.filter(
    (s) => s.role === role || (role === '刑事' && (s.role === 'ゲスト' || s.role === '刑事'))
  );

  const [autoSkills, setAutoSkills] = useState<CharacterSkill[]>(
    Array.isArray(characterClass?.autoSkills)
      ? JSON.parse(JSON.stringify(characterClass.autoSkills))
      : []
  );
  const [showAutoSkillsSection, setShowAutoSkillsSection] = useState(true);

  // 新規自動取得スキルのインライン入力用
  const [isAddingAutoSkill, setIsAddingAutoSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillType, setNewSkillType] = useState('補助');
  const [newSkillCost, setNewSkillCost] = useState('なし');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillFlavor, setNewSkillFlavor] = useState('');

  // 背景表の初期化
  const defaultBgCount = (characterClass?.role || role) === '助手' ? 6 : 10;
  const initialBackgroundTable: BackgroundTableItem[] = characterClass?.backgroundTable && characterClass.backgroundTable.length > 0
    ? JSON.parse(JSON.stringify(characterClass.backgroundTable))
    : Array.from({ length: defaultBgCount }, (_, i) => ({
        roll: i + 1,
        title: '',
        description: ''
      }));

  const [backgroundTable, setBackgroundTable] = useState<BackgroundTableItem[]>(initialBackgroundTable);
  const [showBackgroundSection, setShowBackgroundSection] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form state when characterClass prop changes
  React.useEffect(() => {
    setName(characterClass?.name || '');
    setRole(characterClass?.role || '探偵');
    setAlias(characterClass?.alias || '');
    setSourceBook(characterClass?.sourceBook || '基本ルールブック');
    setSkillsAcquired(characterClass?.skillsAcquired || '');
    setDescription(characterClass?.description || '');
    setAutoSkills(
      Array.isArray(characterClass?.autoSkills)
        ? JSON.parse(JSON.stringify(characterClass.autoSkills))
        : []
    );
    const count = (characterClass?.role || '探偵') === '助手' ? 6 : 10;
    const bg = characterClass?.backgroundTable && characterClass.backgroundTable.length > 0
      ? JSON.parse(JSON.stringify(characterClass.backgroundTable))
      : Array.from({ length: count }, (_, i) => ({ roll: i + 1, title: '', description: '' }));
    setBackgroundTable(bg);
  }, [characterClass]);

  // 背景表の編集ハンドラ
  const handleBackgroundChange = (
    index: number,
    field: 'title' | 'description',
    value: string
  ) => {
    const updated = [...backgroundTable];
    updated[index] = { ...updated[index], [field]: value };
    setBackgroundTable(updated);
  };

  const handleResetBackgrounds = () => {
    const count = role === '助手' ? 6 : 10;
    setBackgroundTable(
      Array.from({ length: count }, (_, i) => ({
        roll: i + 1,
        title: '',
        description: ''
      }))
    );
  };

  const handleAdjustBackgroundCount = (targetCount: number) => {
    if (targetCount === backgroundTable.length) return;
    if (targetCount < backgroundTable.length) {
      setBackgroundTable(backgroundTable.slice(0, targetCount));
    } else {
      const added = Array.from({ length: targetCount - backgroundTable.length }, (_, i) => ({
        roll: backgroundTable.length + i + 1,
        title: '',
        description: ''
      }));
      setBackgroundTable([...backgroundTable, ...added]);
    }
  };

  // 自動取得アクションの操作
  const handleAddAutoSkill = () => {
    if (!newSkillName.trim()) {
      setErrorMsg('自動取得アクション名を入力してください');
      return;
    }
    if (!newSkillDesc.trim()) {
      setErrorMsg('自動取得アクションの効果・内容を入力してください');
      return;
    }

    const created: CharacterSkill = {
      id: `auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newSkillName.trim(),
      role: role as any,
      category: '自動取得',
      type: newSkillType.trim() || '補助',
      timing: newSkillType.trim() || '補助',
      cost: newSkillCost.trim() || 'なし',
      target: newSkillCost.trim() || 'なし',
      description: newSkillDesc.trim(),
      flavor: newSkillFlavor.trim(),
      relatedSituationIds: []
    };

    setAutoSkills((prev) => [...prev, created]);
    setNewSkillName('');
    setNewSkillType('補助');
    setNewSkillCost('なし');
    setNewSkillDesc('');
    setNewSkillFlavor('');
    setIsAddingAutoSkill(false);
    setErrorMsg('');
  };

  const handleUpdateAutoSkill = (
    index: number,
    field: keyof CharacterSkill,
    val: string
  ) => {
    const updated = [...autoSkills];
    updated[index] = { ...updated[index], [field]: val };
    setAutoSkills(updated);
  };

  const handleDeleteAutoSkill = (index: number) => {
    setAutoSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetAutoSkillsToRole = () => {
    setAutoSkills(roleDefaultAutoSkills.map((s) => ({ ...s })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('クラス名を入力してください');
      return;
    }

    // 背景表のクリーンアップ
    const validBackgrounds = backgroundTable.map((bg, idx) => ({
      roll: idx + 1,
      title: bg.title.trim(),
      description: bg.description.trim()
    }));

    // 自動取得アクションのクリーンアップ
    const validAutoSkills = autoSkills
      .filter((s) => s.name.trim().length > 0)
      .map((s) => ({
        ...s,
        role: role as any,
        category: '自動取得' as const,
        name: s.name.trim(),
        type: (s.type || s.timing || '補助').trim(),
        timing: (s.type || s.timing || '補助').trim(),
        cost: (s.cost || s.target || 'なし').trim(),
        target: (s.cost || s.target || 'なし').trim(),
        description: s.description ? s.description.trim() : '',
        flavor: s.flavor ? s.flavor.trim() : ''
      }));

    setSaving(true);
    try {
      const payload: CharacterClass = {
        id: characterClass?.id || `cls-${Date.now()}`,
        name: name.trim(),
        role,
        alias: alias.trim() || name.trim(),
        sourceBook: sourceBook.trim() || '基本ルールブック',
        skillsAcquired: skillsAcquired.trim(),
        description: description.trim(),
        autoSkills: validAutoSkills,
        backgroundTable: validBackgrounds,
        recommendedSituationIds: characterClass?.recommendedSituationIds || [],
        signatureSkills: []
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="edit-class-overlay"
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex justify-center items-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        id="edit-class-modal"
        className="w-full max-w-3xl bg-stone-100 rounded-xl shadow-2xl border-2 border-stone-800 my-auto flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-stone-900 text-amber-100 px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-800/60 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-900 text-amber-200 border border-amber-700">
              {isNew ? 'NEW CLASS' : 'EDIT CLASS'}
            </span>
            <h3 className="text-base font-bold font-detective-title">
              {isNew ? 'クラス調書の新規登録 (探偵 / 助手 / 刑事)' : `${name || 'クラス'} の調書編集`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                役割（ロール） <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CharacterRole)}
                className="w-full p-2 bg-white border border-stone-300 rounded font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-600 text-sm"
              >
                <option value="探偵">探偵</option>
                <option value="助手">助手</option>
                <option value="刑事">刑事（ゲスト）</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                クラス名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 超探偵, 相棒, ベテラン刑事"
                required
                className="w-full p-2 bg-white border border-stone-300 rounded font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-600 text-sm font-bold"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                エイリアス（英字・別称）
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="例: Genius Detective"
                className="w-full p-2 bg-white border border-stone-300 rounded font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-600 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                出典・典拠ルールブック
              </label>
              <input
                type="text"
                value={sourceBook}
                onChange={(e) => setSourceBook(e.target.value)}
                placeholder="例: 基本ルールブック P.34"
                className="w-full p-2 bg-white border border-stone-300 rounded font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                修得技能指定
              </label>
              <input
                type="text"
                value={skillsAcquired}
                onChange={(e) => setSkillsAcquired(e.target.value)}
                placeholder="例: 洞察カテゴリから2つ、鑑識カテゴリから2つ、好きなカテゴリから2つ"
                className="w-full p-2 bg-white border border-stone-300 rounded font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-600 text-sm"
              />
            </div>
          </div>

          {/* フレーバーテキスト・クラス解説 */}
          <div className="bg-amber-50/70 p-3.5 rounded-lg border border-amber-300/80 space-y-1.5">
            <label className="block text-xs font-bold text-amber-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-800" />
                <span>フレーバーテキスト・クラス解説</span>
              </span>
              <span className="text-[11px] font-normal text-amber-800/80">人物像・生い立ち・立ち振る舞い</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="クラスの人物像、生い立ち、背景や立ち振る舞いについての詳細なフレーバー解説文を入力してください。"
              className="w-full p-2.5 bg-white border border-stone-300 rounded font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-600 text-xs sm:text-sm leading-relaxed"
            />
          </div>

          {/* 【自動取得アクションの設定セクション】（クラス調書のアクションは自動取得のみ） */}
          <div className="border-2 border-sky-300/90 rounded-lg p-3.5 bg-sky-50/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-sky-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-800" />
                <h4 className="text-xs sm:text-sm font-bold font-detective-title text-sky-950">
                  {name || 'このクラス'}（{role}）の自動取得アクション
                </h4>
                <span className="text-[11px] bg-sky-100 text-sky-900 border border-sky-300 px-1.5 py-0.2 rounded font-mono font-bold">
                  {autoSkills.length}件登録
                </span>
              </div>
              <div className="flex items-center gap-2">
                {roleDefaultAutoSkills.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAutoSkillsToRole}
                    className="text-[11px] text-sky-800 hover:text-sky-950 flex items-center gap-1 hover:bg-sky-100/80 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    title={`${role}の標準スキルを再読込`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    標準初期化
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddingAutoSkill(true)}
                  className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded font-bold flex items-center gap-1 text-[11px] transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  自動取得アクション追加
                </button>
                <button
                  type="button"
                  onClick={() => setShowAutoSkillsSection(!showAutoSkillsSection)}
                  className="text-stone-600 hover:text-stone-900 p-1 cursor-pointer"
                >
                  {showAutoSkillsSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {showAutoSkillsSection && (
              <div className="space-y-3">
                <p className="text-[11px] text-sky-900 font-serif">
                  ※キャラクター作成時に{role}が無条件で自動修得するアクションです。各アクションの名前・効果・フレーバーを自由に設定・編集できます。
                </p>

                {/* 新規自動取得アクション追加フォーム */}
                {isAddingAutoSkill && (
                  <div className="p-3.5 bg-white border-2 border-sky-500 rounded-lg shadow-sm space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                      <span className="font-bold text-xs text-sky-900 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> 新しい自動取得アクションを入力
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingAutoSkill(false)}
                        className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                          アクション名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="例: ひらめき, パートナーへの信頼"
                          className="w-full p-1.5 border border-stone-300 rounded text-xs font-bold font-serif"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                          タイプ
                        </label>
                        <input
                          type="text"
                          value={newSkillType}
                          onChange={(e) => setNewSkillType(e.target.value)}
                          placeholder="例: 補助, 判定"
                          className="w-full p-1.5 border border-stone-300 rounded text-xs font-serif"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                          コスト
                        </label>
                        <input
                          type="text"
                          value={newSkillCost}
                          onChange={(e) => setNewSkillCost(e.target.value)}
                          placeholder="例: なし, 余裕1"
                          className="w-full p-1.5 border border-stone-300 rounded text-xs font-serif font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                        効果・ルール内容 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={newSkillDesc}
                        onChange={(e) => setNewSkillDesc(e.target.value)}
                        placeholder="アクションの効果、判定方法、使用条件などを入力"
                        className="w-full p-1.5 border border-stone-300 rounded text-xs font-serif leading-relaxed"
                      />
                    </div>

                    {/* フレーバー入力欄 */}
                    <div className="bg-sky-50/70 p-2 rounded border border-sky-200 space-y-0.5">
                      <label className="block text-[11px] font-bold text-sky-950 flex items-center gap-1">
                        <Quote className="w-3 h-3 text-sky-700" />
                        <span>フレーバーテキスト（演出・台詞・描写）</span>
                      </label>
                      <textarea
                        rows={2}
                        value={newSkillFlavor}
                        onChange={(e) => setNewSkillFlavor(e.target.value)}
                        placeholder="台詞や演出のフレーバーテキストを入力してください（例: 「私の灰色の脳細胞が告げている…」）"
                        className="w-full p-1.5 bg-white border border-stone-300 rounded text-xs font-serif italic"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-stone-200">
                      <button
                        type="button"
                        onClick={() => setIsAddingAutoSkill(false)}
                        className="px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded cursor-pointer"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        onClick={handleAddAutoSkill}
                        className="px-3 py-1 bg-sky-800 hover:bg-sky-900 text-white rounded text-xs font-bold cursor-pointer"
                      >
                        自動取得アクションを追加
                      </button>
                    </div>
                  </div>
                )}

                {/* 自動取得アクション一覧カードリスト */}
                {autoSkills.length === 0 ? (
                  <div className="p-3 text-center bg-white rounded-lg border border-dashed border-sky-300 text-xs text-stone-500">
                    自動取得アクションが設定されていません。「自動取得アクション追加」または「標準初期化」を行ってください。
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {autoSkills.map((sk, idx) => (
                      <div
                        key={sk.id || idx}
                        className="p-3 bg-white border-2 border-sky-200 rounded-lg shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-sky-100 text-sky-900 border border-sky-300 rounded font-mono">
                              #{idx + 1}
                            </span>
                            <input
                              type="text"
                              value={sk.name}
                              onChange={(e) => handleUpdateAutoSkill(idx, 'name', e.target.value)}
                              placeholder="アクション名"
                              className="font-bold text-xs text-stone-900 bg-stone-50 border border-stone-200 rounded px-2 py-1 flex-1 font-serif"
                            />
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-stone-500">タイプ:</span>
                              <input
                                type="text"
                                value={sk.type || sk.timing || '補助'}
                                onChange={(e) => handleUpdateAutoSkill(idx, 'type', e.target.value)}
                                className="w-16 text-xs text-stone-800 bg-stone-50 border border-stone-200 rounded px-1.5 py-1 text-center font-serif"
                              />
                              <span className="text-[10px] text-stone-500">コスト:</span>
                              <input
                                type="text"
                                value={sk.cost || sk.target || 'なし'}
                                onChange={(e) => handleUpdateAutoSkill(idx, 'cost', e.target.value)}
                                className="w-14 text-xs text-stone-800 bg-stone-50 border border-stone-200 rounded px-1.5 py-1 text-center font-mono"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAutoSkill(idx)}
                            className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors shrink-0 cursor-pointer"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* 効果・内容 */}
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                            効果・ルール内容
                          </label>
                          <textarea
                            rows={2}
                            value={sk.description || ''}
                            onChange={(e) => handleUpdateAutoSkill(idx, 'description', e.target.value)}
                            placeholder="効果・ルール処理手順"
                            className="w-full text-xs text-stone-800 bg-stone-50 border border-stone-200 rounded p-1.5 font-serif leading-relaxed"
                          />
                        </div>

                        {/* フレーバーテキスト入力欄 */}
                        <div className="bg-sky-50/50 p-2 rounded border border-sky-100">
                          <label className="block text-[10px] font-bold text-sky-950 mb-0.5 flex items-center gap-1">
                            <Quote className="w-3 h-3 text-sky-700" />
                            <span>フレーバー（台詞・演出描写）</span>
                          </label>
                          <textarea
                            rows={1}
                            value={sk.flavor || ''}
                            onChange={(e) => handleUpdateAutoSkill(idx, 'flavor', e.target.value)}
                            placeholder="キャラクターの台詞や情景描写を入力（任意）"
                            className="w-full text-xs text-stone-800 bg-white border border-stone-200 rounded p-1.5 font-serif italic"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 背景表セクション */}
          <div className="border border-stone-300 rounded-lg p-3.5 bg-stone-50 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-800" />
                <h4 className="text-xs sm:text-sm font-bold font-detective-title text-stone-900">
                  背景表（{backgroundTable.length}項目・{backgroundTable.length === 6 ? '1D6' : '1D10'}）
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-stone-300 rounded bg-white text-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleAdjustBackgroundCount(6)}
                    className={`px-2 py-0.5 cursor-pointer font-bold ${
                      backgroundTable.length === 6
                        ? 'bg-amber-900 text-amber-100'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    6枠 (1D6)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustBackgroundCount(10)}
                    className={`px-2 py-0.5 cursor-pointer font-bold ${
                      backgroundTable.length === 10
                        ? 'bg-amber-900 text-amber-100'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    10枠 (1D10)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleResetBackgrounds}
                  className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer px-2 py-0.5 hover:bg-stone-200 rounded"
                >
                  <RotateCcw className="w-3 h-3" />
                  空枠リセット
                </button>
                <button
                  type="button"
                  onClick={() => setShowBackgroundSection(!showBackgroundSection)}
                  className="text-stone-600 hover:text-stone-900 p-1 cursor-pointer"
                >
                  {showBackgroundSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {showBackgroundSection && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {backgroundTable.map((bg, idx) => (
                  <div
                    key={bg.roll}
                    className="flex items-start gap-2 bg-white p-2 rounded border border-stone-200"
                  >
                    <span className="w-6 h-6 rounded bg-stone-800 text-amber-200 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                      {bg.roll}
                    </span>
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={bg.title}
                        onChange={(e) => handleBackgroundChange(idx, 'title', e.target.value)}
                        placeholder={`出目 ${bg.roll} の背景名（例: 名探偵の先祖）`}
                        className="w-full p-1 border border-stone-200 rounded text-xs font-bold font-serif"
                      />
                      <textarea
                        rows={2}
                        value={bg.description}
                        onChange={(e) => handleBackgroundChange(idx, 'description', e.target.value)}
                        placeholder="背景の解説・フレーバーテキストを入力"
                        className="w-full p-1 border border-stone-200 rounded text-xs font-serif leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Submit Button */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded font-serif text-xs transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-amber-900 hover:bg-amber-800 text-amber-100 rounded font-serif text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? '保存中…' : '調書を保存'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
