import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Sparkles, Image as ImageIcon, Dice6, Tag, Check, AlertCircle, EyeOff, RotateCcw, Shield, Users } from 'lucide-react';
import { GuestCharacter, GuestReactionItem } from '../types.ts';
import { DEFAULT_AVATAR_FEMALE, DEFAULT_AVATAR_MALE, DEFAULT_AVATAR_MYSTERIOUS } from '../initialGuestAndSummaryData.ts';
import { SecretAvatar } from './SecretAvatar.tsx';

interface EditGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: GuestCharacter | null;
  onSave: (guest: GuestCharacter) => Promise<void>;
  passkey: string;
}

const COMMON_TAGS = ['依頼人', '容疑者', '被害者', '目撃者', '警察', '協力者', '重要参考人', '学生', '一般人'];

const PRESET_AVATARS = [
  { label: '女性（依頼人・学生）', url: DEFAULT_AVATAR_FEMALE },
  { label: '男性（刑事・捜査員）', url: DEFAULT_AVATAR_MALE },
  { label: '影・不審者・ミステリアス', url: DEFAULT_AVATAR_MYSTERIOUS },
  { label: 'シークレット（画像なし）', url: '' }
];

const DEFAULT_REACTION_PRESET: GuestReactionItem[] = [
  { roll: 1, reaction: '【警戒】「何か用ですか？ 私には話すことなどありません」と警戒心を露わにする。' },
  { roll: 2, reaction: '【動揺】「そ、そんな…何かの間違いです」と視線をそらし、手元を震わせる。' },
  { roll: 3, reaction: '【懇願】「信じてください、嘘じゃありません！ お願いです、助けて…」と助手に縋る。' },
  { roll: 4, reaction: '【沈黙】唇を真一文字に結び、こちらの目をじっと見つめ返して口を閉ざす。' },
  { roll: 5, reaction: '【協調】「…分かりました。少し気になる噂を耳にしたのですが」と情報を小声で話す。' },
  { roll: 6, reaction: '【核心】「実は…あの夜、見てしまったんです」と事件の核心に触れる告白をする。' }
];

export const EditGuestModal: React.FC<EditGuestModalProps> = ({
  isOpen,
  onClose,
  guest,
  onSave,
  passkey
}) => {
  const [name, setName] = useState('');
  const [furigana, setFurigana] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [summary, setSummary] = useState('');
  const [profile, setProfile] = useState('');
  const [relationship, setRelationship] = useState('');
  const [recommendedClass, setRecommendedClass] = useState('');
  const [recommendedSkills, setRecommendedSkills] = useState('');
  const [candidateClasses, setCandidateClasses] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [reactions, setReactions] = useState<GuestReactionItem[]>([
    { roll: 1, reaction: '' },
    { roll: 2, reaction: '' },
    { roll: 3, reaction: '' },
    { roll: 4, reaction: '' },
    { roll: 5, reaction: '' },
    { roll: 6, reaction: '' }
  ]);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (guest) {
      setName(guest.name || '');
      setFurigana(guest.furigana || '');
      setGender(guest.gender || '');
      setAge(guest.age || '');
      setOccupation(guest.occupation || '');
      setSummary(guest.summary || '');
      setProfile(guest.profile || '');
      setRelationship(guest.relationship || (guest as any).relationships || '');
      setRecommendedClass(guest.recommendedClass || '');
      setRecommendedSkills(guest.recommendedSkills || '');
      setCandidateClasses(guest.candidateClasses || (guest as any).classCandidates || '');
      setContent(guest.content || '');
      setImageUrl(guest.imageUrl || '');
      setTags(guest.tags || []);
      if (Array.isArray(guest.reactions) && guest.reactions.length === 6) {
        setReactions(guest.reactions);
      } else {
        setReactions([1, 2, 3, 4, 5, 6].map((roll) => ({ roll, reaction: '' })));
      }
    } else {
      // Initialize new guest with blank fields so users can enter ONLY what they want
      setName('');
      setFurigana('');
      setGender('');
      setAge('');
      setOccupation('');
      setSummary('');
      setRelationship('');
      setProfile('');
      setRecommendedClass('');
      setRecommendedSkills('');
      setCandidateClasses('');
      setContent('');
      setImageUrl(''); // Default to no image (Secret)
      setTags([]);
      setReactions([1, 2, 3, 4, 5, 6].map((roll) => ({ roll, reaction: '' })));
    }
    setErrorMessage(null);
  }, [guest, isOpen]);

  if (!isOpen) return null;

  // Handle local image file upload and convert to base64 data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('画像ファイル（PNG, JPG, WebP, GIFなど）を選択してください');
      return;
    }

    // Limit to 2.5MB to keep JSON lightweight
    if (file.size > 2.5 * 1024 * 1024) {
      setErrorMessage('画像サイズが大きすぎます。2.5MB以下の画像を選択してください');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
      setErrorMessage(null);
    };
    reader.onerror = () => {
      setErrorMessage('画像の読み込みに失敗しました');
    };
    reader.readAsDataURL(file);
  };

  const handleReactionChange = (roll: number, text: string) => {
    setReactions((prev) =>
      prev.map((r) => (r.roll === roll ? { ...r, reaction: text } : r))
    );
  };

  const applyReactionPreset = () => {
    setReactions(DEFAULT_REACTION_PRESET);
  };

  const clearReactions = () => {
    setReactions([1, 2, 3, 4, 5, 6].map((roll) => ({ roll, reaction: '' })));
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setCustomTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('「名前」を入力してください');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const guestData: GuestCharacter = {
        id: guest ? guest.id : `guest-${Date.now()}`,
        name: name.trim(),
        furigana: furigana.trim(),
        gender: gender.trim(),
        age: age.trim(),
        occupation: occupation.trim() || undefined,
        summary: summary.trim(),
        profile: profile.trim(),
        relationship: relationship.trim(),
        recommendedClass: recommendedClass.trim(),
        recommendedSkills: recommendedSkills.trim(),
        candidateClasses: candidateClasses.trim(),
        content: content.trim(),
        reactions,
        imageUrl: imageUrl.trim(), // 空文字の場合は明示的に空文字として送信し、サーバーで画像クリア（シークレット化）させる
        tags: tags,
        updatedAt: new Date().toISOString()
      };

      await onSave(guestData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-3xl w-full my-auto shadow-2xl flex flex-col text-stone-200 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-700/80 border border-amber-600/50 flex items-center justify-center text-amber-200 font-serif font-bold text-sm shadow-inner">
              客
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-amber-100 font-serif">
                {guest ? `ゲスト調書の編集：${guest.name}` : '新規ゲスト（NPC）の追加'}
              </h2>
              <p className="text-xs text-stone-400 font-serif">
                依頼人・容疑者・協力者などの調書データ（乗せたい項目だけ自由に入力可能）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Guide banner: Enter only what you want */}
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">乗せたい項目だけご入力いただけます：</span>
              <span className="text-amber-200/80 ml-1">
                必須項目は「名前」のみです。フリガナ、概要、プロフィール、推奨技能、クラス候補、内容、リアクション表は空欄のまま保存すれば調書に表示されません。画像がない場合は自動的に「シークレット（極秘）」として表示されます。
              </span>
            </div>
          </div>

          {/* Top Section: Portrait Image + Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Image Column */}
            <div className="sm:col-span-1 flex flex-col items-center space-y-3 bg-stone-850/70 p-3.5 rounded-xl border border-stone-800">
              <span className="font-bold text-stone-300 text-xs self-start flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>ゲスト画像（未登録時はシークレット）</span>
              </span>

              {/* Preview Avatar */}
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-stone-950 border-2 border-amber-900/60 shadow-inner flex items-center justify-center relative group">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={name || 'ゲスト画像'}
                      className="w-full h-full object-cover object-top"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      title="画像を解除（シークレット表示にする）"
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-stone-900/90 text-stone-300 hover:text-rose-400 hover:bg-stone-900 transition-colors shadow-xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <SecretAvatar size="xl" />
                )}
              </div>

              {/* Status Badge & Action */}
              <div className="w-full text-center">
                {imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-rose-950/80 text-stone-300 hover:text-rose-300 border border-stone-700 hover:border-rose-800 text-[11px] transition-colors cursor-pointer"
                  >
                    <EyeOff className="w-3 h-3 text-rose-400" />
                    <span>画像を外してシークレットにする</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/50 text-amber-300 border border-amber-800/70 text-[11px] font-serif">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>シークレット（極秘）設定中</span>
                  </div>
                )}
              </div>

              {/* Image Input Options */}
              <div className="w-full space-y-2">
                <div className="flex gap-1 bg-stone-900 p-0.5 rounded-lg text-[11px] border border-stone-800">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`flex-1 py-1 rounded font-medium transition-colors cursor-pointer ${
                      imageInputMode === 'upload' ? 'bg-amber-900/80 text-amber-200' : 'text-stone-400'
                    }`}
                  >
                    ファイル
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('presets')}
                    className={`flex-1 py-1 rounded font-medium transition-colors cursor-pointer ${
                      imageInputMode === 'presets' ? 'bg-amber-900/80 text-amber-200' : 'text-stone-400'
                    }`}
                  >
                    プリセット
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`flex-1 py-1 rounded font-medium transition-colors cursor-pointer ${
                      imageInputMode === 'url' ? 'bg-amber-900/80 text-amber-200' : 'text-stone-400'
                    }`}
                  >
                    URL
                  </button>
                </div>

                {imageInputMode === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>端末から画像を選択</span>
                    </button>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="w-full mt-1.5 py-1 text-[11px] text-stone-400 hover:text-red-400 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <EyeOff className="w-3 h-3" />
                        <span>画像を外す（シークレットにする）</span>
                      </button>
                    )}
                    <p className="text-[10px] text-stone-400 text-center mt-1">PNG, JPG, WebP (2.5MB以下)</p>
                  </div>
                )}

                {imageInputMode === 'presets' && (
                  <div className="space-y-1">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = preset.url ? imageUrl === preset.url : !imageUrl;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          className={`w-full text-left p-2 rounded text-[11px] border transition-colors flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-950/60 border-amber-600 text-amber-200 font-medium shadow-2xs'
                              : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              preset.url ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          />
                          <span className="truncate flex-1">{preset.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {imageInputMode === 'url' && (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... 画像URL"
                      className="w-full p-2 bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600"
                    />
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="w-full py-1 text-[11px] text-stone-400 hover:text-rose-400 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <EyeOff className="w-3 h-3" />
                        <span>URLを消去してシークレットにする</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info Columns */}
            <div className="sm:col-span-2 space-y-3.5">
              {/* Name & Furigana Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-7">
                  <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
                    <span>名前</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: 雨宮 詩織"
                    required
                    className="w-full p-2.5 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 font-serif font-bold text-sm sm:text-base placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    フリガナ（よみがな）
                  </label>
                  <input
                    type="text"
                    value={furigana}
                    onChange={(e) => setFurigana(e.target.value)}
                    placeholder="例: あまみや しおり"
                    className="w-full p-2.5 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 text-xs sm:text-sm font-serif"
                  />
                </div>
              </div>

              {/* Gender, Age & Occupation Row (名前の横/下に配置・未入力時は非表示) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1 flex items-center justify-between">
                    <span>性別</span>
                    <span className="text-[10px] text-stone-400 font-normal">※任意</span>
                  </label>
                  <input
                    type="text"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="例: 女性、男性、不詳"
                    className="w-full p-2 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 text-xs font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1 flex items-center justify-between">
                    <span>年齢</span>
                    <span className="text-[10px] text-stone-400 font-normal">※任意</span>
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="例: 24歳、20代半ば"
                    className="w-full p-2 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 text-xs font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-200 mb-1 flex items-center justify-between">
                    <span>職業</span>
                    <span className="text-[10px] text-stone-400 font-normal">※任意</span>
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="例: 記者、医師、刑事、学生"
                    className="w-full p-2 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 text-xs font-serif"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1 flex items-center justify-between">
                  <span>概要（立場・一言説明）</span>
                  <span className="text-[10px] text-stone-400 font-normal">※任意（未記入なら非表示）</span>
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="例: 旧家の若き当主代理。洋館での奇妙な脅迫状について相談に訪れた依頼人。"
                  className="w-full p-2 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              {/* Recommended Class, Candidate Classes & Recommended Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center justify-between">
                    <span>推奨クラス</span>
                    <span className="text-[10px] text-stone-400 font-normal">※任意</span>
                  </label>
                  <input
                    type="text"
                    value={recommendedClass}
                    onChange={(e) => setRecommendedClass(e.target.value)}
                    placeholder="例: 助手、刑事、探偵"
                    className="w-full p-2 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 text-xs font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-200 mb-1 flex items-center justify-between">
                    <span>クラス候補</span>
                    <span className="text-[10px] text-stone-400 font-normal">※任意</span>
                  </label>
                  <input
                    type="text"
                    value={candidateClasses}
                    onChange={(e) => setCandidateClasses(e.target.value)}
                    placeholder="例: 助手、刑事、一般人、情報屋"
                    className="w-full p-2 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 text-xs font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-1 flex items-center justify-between">
                    <span>推奨技能</span>
                    <span className="text-[10px] text-stone-400 font-normal">※任意</span>
                  </label>
                  <input
                    type="text"
                    value={recommendedSkills}
                    onChange={(e) => setRecommendedSkills(e.target.value)}
                    placeholder="例: 『聞き込み』『観察』『心理』"
                    className="w-full p-2 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 text-xs font-serif"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-stone-400" />
                    役割・属性タグ
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">※任意</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_TAGS.map((t) => {
                    const isSelected = tags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className={`px-2 py-0.5 rounded text-xs border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-amber-800 text-amber-100 border-amber-700 font-medium'
                            : 'bg-stone-850 text-stone-400 border-stone-700 hover:bg-stone-800'
                        }`}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="カスタムタグを追加..."
                    className="flex-1 p-1.5 bg-stone-850 border border-stone-700 rounded text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded text-xs font-medium text-stone-200 cursor-pointer"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Relationship Section */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-200">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                関係性（探偵・助手、被害者や他NPCとの関係・感情・因縁など）
              </span>
              <span className="text-[10px] text-stone-400 font-normal">※任意（未記入なら調書に表示されません）</span>
            </label>
            <textarea
              rows={3}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="例: 【探偵】かつて事件で助けられた恩義があり、強い信頼を寄せている。&#10;【助手】同世代で話しやすく、不安なときに頼りにしている。&#10;【被害者】幼馴染だが最近の遺産相続を巡り疎遠になっていた。"
              className="w-full p-2.5 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 font-serif leading-relaxed text-xs sm:text-sm"
            />
          </div>

          {/* Profile Section */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-300 flex items-center justify-between">
              <span>プロフィール（年齢、職業、外見、性格、生い立ちなど）</span>
              <span className="text-[10px] text-stone-400 font-normal">※任意（未記入なら調書に表示されません）</span>
            </label>
            <textarea
              rows={3}
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              placeholder="例: 24歳・大学院生（民俗学専攻）。亡き祖父の遺産管理を巡り親族と確執を抱えている。礼儀正しく落ち着いた物腰だが、祖父の死の真相を知ることに強い怯えと執着を抱えている。"
              className="w-full p-2.5 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 font-serif leading-relaxed"
            />
          </div>

          {/* Content Section */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-300 flex items-center justify-between">
              <span>内容（秘密、抱える事情、事件における立ち位置、GM情報など）</span>
              <span className="text-[10px] text-stone-400 font-normal">※任意（未記入なら調書に表示されません）</span>
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例: 彼女は脅迫状の送り主が身内だと疑っているが、実は無意識のうちに犯人に誘導されている。捜査フェイズで証言の矛盾を突くと隠された手帳を渡してくれる。"
              className="w-full p-2.5 bg-stone-850 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 font-serif leading-relaxed"
            />
          </div>

          {/* 1D6 Reaction Table Section */}
          <div className="space-y-3 bg-stone-850/80 p-4 rounded-xl border border-stone-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-900/60 border border-amber-700/50 text-amber-300">
                  <Dice6 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-100 font-serif">リアクション表（1D6）</h3>
                  <p className="text-[11px] text-stone-400">
                    話しかけた際や調査時の反応（すべて空にすると調書には表示されません）
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={clearReactions}
                  className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 border border-stone-700 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="リアクション表を空にして調書に乗せない"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>乗せない（全クリア）</span>
                </button>
                <button
                  type="button"
                  onClick={applyReactionPreset}
                  className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="定型リアクション（警戒・動揺・懇願・沈黙・協調・核心）を自動入力"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>定型テンプレ</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {reactions.map((r) => (
                <div key={r.roll} className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-stone-900 border border-amber-700/60 flex items-center justify-center font-serif font-bold text-amber-300 text-base shrink-0 mt-0.5 shadow-xs">
                    {r.roll}
                  </div>
                  <input
                    type="text"
                    value={r.reaction}
                    onChange={(e) => handleReactionChange(r.roll, e.target.value)}
                    placeholder={`出目 ${r.roll} の反応（空欄でもOK）`}
                    className="flex-1 p-3 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 text-base placeholder:text-stone-500 focus:outline-hidden focus:border-amber-600 font-serif"
                  />
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-stone-850 border-t border-stone-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? '保存中...' : guest ? '調書を更新' : 'ゲストを登録'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
