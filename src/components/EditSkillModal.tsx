import React, { useState } from 'react';
import {
  CharacterSkill,
  SkillRole
} from '../types.ts';
import { X, Save, AlertCircle, Zap, Sparkles, Trash2 } from 'lucide-react';

interface EditSkillModalProps {
  skill: CharacterSkill | null; // null for new skill
  defaultCategory?: '固有' | '自動取得';
  onClose: () => void;
  onSave: (skill: CharacterSkill, migrationMeta?: { previousCategory: '固有' | '自動取得'; previousId?: string }) => Promise<void>;
  onDelete?: (skillId: string) => Promise<void>;
  passkey: string;
}

export const EditSkillModal: React.FC<EditSkillModalProps> = ({
  skill,
  defaultCategory = '固有',
  onClose,
  onSave,
  onDelete,
}) => {
  const isNew = !skill || !skill.id;
  const initialCategory = (skill?.category as '固有' | '自動取得') || defaultCategory;

  const [name, setName] = useState(skill?.name || '');
  const [role, setRole] = useState<SkillRole>((skill?.role as SkillRole) || '探偵');
  const [skillCategory, setSkillCategory] = useState<'固有' | '自動取得'>(initialCategory);
  const [skillType, setSkillType] = useState(skill?.type || skill?.timing || '補助');
  const [cost, setCost] = useState(skill?.cost || skill?.target || 'なし');
  const [description, setDescription] = useState(skill?.description || '');
  const [flavor, setFlavor] = useState(skill?.flavor || '');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form state when skill prop changes
  React.useEffect(() => {
    setName(skill?.name || '');
    setRole((skill?.role as SkillRole) || '探偵');
    setSkillCategory((skill?.category as '固有' | '自動取得') || defaultCategory);
    setSkillType(skill?.type || skill?.timing || '補助');
    setCost(skill?.cost || skill?.target || 'なし');
    setDescription(skill?.description || '');
    setFlavor(skill?.flavor || '');
  }, [skill, defaultCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('アクション名（題名）を入力してください');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('アクションの内容（効果・ルール処理）を入力してください');
      return;
    }

    setSaving(true);
    try {
      // カテゴリに応じた適切なID生成
      let targetId = skill?.id;
      if (!targetId) {
        targetId = skillCategory === '自動取得' ? `auto-${Date.now()}` : `sk-${Date.now()}`;
      } else if (skillCategory === '固有' && targetId.startsWith('auto-')) {
        // 自動取得から固有へ変更時: sk- プレフィックスに移行
        targetId = `sk-${targetId.replace(/^auto-/, '')}`;
      } else if (skillCategory === '自動取得' && !targetId.startsWith('auto-')) {
        // 固有から自動取得へ変更時: auto- プレフィックスに移行
        targetId = `auto-${targetId.replace(/^sk-/, '')}`;
      }

      const payload: CharacterSkill = {
        id: targetId,
        name: name.trim(),
        role,
        category: skillCategory,
        type: skillType.trim() || '補助',
        timing: skillType.trim() || '補助',
        cost: cost.trim() || 'なし',
        target: cost.trim() || 'なし',
        description: description.trim(),
        flavor: flavor.trim(),
        relatedSituationIds: skill?.relatedSituationIds || []
      };

      await onSave(payload, {
        previousCategory: initialCategory,
        previousId: skill?.id
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'アクションの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!skill || !onDelete) return;

    setDeleting(true);
    try {
      await onDelete(skill.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'アクションの削除に失敗しました');
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div
      id="edit-skill-overlay"
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex justify-center items-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        id="edit-skill-modal"
        className="w-full max-w-xl bg-stone-100 rounded-xl shadow-2xl border-2 border-stone-800 my-auto flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-stone-900 text-amber-100 px-5 py-3 flex items-center justify-between border-b-2 border-amber-800/60 shrink-0">
          <div className="flex items-center space-x-2">
            <span
              className={`font-mono text-xs px-2 py-0.5 rounded font-bold border ${
                skillCategory === '自動取得'
                  ? 'bg-sky-950 text-sky-200 border-sky-700'
                  : 'bg-amber-900 text-amber-200 border-amber-700'
              }`}
            >
              {skillCategory === '自動取得' ? '自動修得アクション' : '固有アクション（クラス非所属・選択修得）'}
            </span>
            <h3 className="text-base font-bold font-detective-title flex items-center gap-1.5">
              {skillCategory === '自動取得' ? (
                <Sparkles className="w-4 h-4 text-sky-400" />
              ) : (
                <Zap className="w-4 h-4 text-amber-400" />
              )}
              {isNew
                ? `${skillCategory === '自動取得' ? '自動修得' : '固有'}アクション新規登録`
                : `${skillCategory === '自動取得' ? '自動修得' : '固有'}アクション「${name || ''}」編集`}
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 text-xs sm:text-sm font-serif">
          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Category & Role selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                分類 <span className="text-red-500">*</span>
              </label>
              <select
                value={skillCategory}
                onChange={(e) => setSkillCategory(e.target.value as '固有' | '自動取得')}
                className="w-full p-2.5 bg-white border border-stone-300 rounded font-serif text-stone-900 text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-600"
              >
                <option value="固有">固有アクション（クラス非所属・選択修得）</option>
                <option value="自動取得">自動修得アクション（役割共通・基本修得能力）</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                役割 <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as SkillRole)}
                className="w-full p-2.5 bg-white border border-stone-300 rounded font-serif text-stone-900 text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-600"
              >
                <option value="探偵">探偵</option>
                <option value="助手">助手</option>
                <option value="フタリ">フタリ</option>
                <option value="ゲスト">ゲスト</option>
              </select>
            </div>
          </div>

          {/* Type & Cost selection with 補助/常駐 and なし/1〜6 preset buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-800">
                  タイプ <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-stone-500 font-sans">「補助」または「常駐」</span>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                {[
                  { id: '補助', label: '⚡ 補助', desc: '宣言・タイミング発動' },
                  { id: '常駐', label: '🛡️ 常駐', desc: '常時自動適用' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSkillType(item.id)}
                    className={`flex-1 py-1 px-2 rounded text-xs font-bold font-serif transition-all cursor-pointer border flex flex-col items-center ${
                      skillType === item.id
                        ? item.id === '補助'
                          ? 'bg-amber-800 text-amber-100 border-amber-600 shadow-2xs'
                          : 'bg-emerald-800 text-emerald-100 border-emerald-600 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[9px] font-normal opacity-80">{item.desc}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={skillType}
                onChange={(e) => setSkillType(e.target.value)}
                placeholder="例: 補助, 常駐"
                required
                className="w-full p-2 bg-white border border-stone-300 rounded font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-600 text-xs sm:text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-800">
                  コスト <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-stone-500 font-sans">消費する余裕（なし、1〜6）</span>
              </div>
              <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                {['なし', '1', '2', '3', '4', '5', '6'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCost(c)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer border ${
                      cost === c
                        ? 'bg-purple-800 text-purple-100 border-purple-600 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="例: なし, 1〜6"
                required
                className="w-full p-2 bg-white border border-stone-300 rounded font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-600 text-xs sm:text-sm font-mono"
              />
            </div>
          </div>

          {/* Skill Name (題名) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              題名（アクション名） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 微細な観察眼, 電撃的ひらめき"
              required
              className="w-full p-2 bg-white border border-stone-300 rounded font-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-600 text-sm"
            />
          </div>

          {/* Description (内容) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              内容（効果・ルール処理手順） <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="アクションの具体的な内容・ルール上の獲得ボーナスや処理手順"
              required
              className="w-full p-2.5 bg-white border border-stone-300 rounded font-serif text-stone-900 leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-amber-600 text-xs sm:text-sm"
            />
          </div>

          {/* Flavor */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              フレーバー
            </label>
            <input
              type="text"
              value={flavor}
              onChange={(e) => setFlavor(e.target.value)}
              placeholder="フレーバーテキスト（任意）"
              className="w-full p-2.5 bg-white border border-stone-300 rounded font-serif text-stone-900 leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-amber-600 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-300 flex items-center justify-between shrink-0">
            <div>
              {!isNew && onDelete && (
                confirmingDelete ? (
                  <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-lg border border-red-200">
                    <span className="text-xs text-red-800 font-bold">本当に削除しますか？</span>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={handleExecuteDelete}
                      className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold cursor-pointer transition-colors"
                    >
                      {deleting ? '削除中…' : '削除実行'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded text-xs cursor-pointer transition-colors"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded text-xs font-serif flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>このアクションを削除</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded text-xs font-serif transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-5 py-2 text-white font-bold rounded text-xs font-serif flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                  skillCategory === '自動取得'
                    ? 'bg-sky-800 hover:bg-sky-900'
                    : 'bg-amber-900 hover:bg-amber-800'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '保存中…' : isNew ? `${skillCategory === '自動取得' ? '自動修得' : '固有'}アクションを追加登録` : '更新を保存'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
