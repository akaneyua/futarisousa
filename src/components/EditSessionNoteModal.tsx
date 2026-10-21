import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Bookmark,
  Tag,
  AlertCircle,
  Plus,
  BookOpen,
  Bold,
  Heading,
  List,
  ListOrdered,
  Table as TableIcon,
  Code,
  Eye,
  Edit3,
  Layers,
  Sparkles,
  FolderTree,
  Image as ImageIcon,
  Upload,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ZoomIn
} from 'lucide-react';
import { SessionNote, SessionNoteCategory } from '../types.ts';
import { FormattedNoteContent, ImageLightboxModal, LightboxImage } from './FormattedNoteContent.tsx';

interface EditSessionNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: SessionNote | null;
  onSave: (note: SessionNote) => Promise<void>;
  passkey: string;
  existingTags?: string[];
}

const CATEGORIES: { label: SessionNoteCategory; description: string; badgeColor: string }[] = [
  { label: '用語', description: 'ゲーム中の基本概念や重要システム名', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' },
  { label: 'キャラ作成', description: '探偵・助手の作成手順や初期リソース早見表', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { label: '小ネタ', description: 'RP用セリフ集、ココフォリアコマンド、マスタリングTips', badgeColor: 'bg-purple-100 text-purple-900 border-purple-300' },
  { label: '判定・ルール', description: 'ダイス目、2D6目標値、フェイズ進行サイクルなど', badgeColor: 'bg-sky-100 text-sky-900 border-sky-300' },
  { label: 'その他', description: 'ハウスルールや雑記・セッションメモ', badgeColor: 'bg-stone-200 text-stone-800 border-stone-300' },
];

const DEFAULT_SUGGESTED_TAGS = [
  '基本用語',
  '探偵',
  '助手',
  'キャラ作成',
  '知ってたカード',
  '余裕',
  '判定',
  '変調',
  '小ネタ',
  '演出Tips',
  'GM向け',
  'PL向け',
  'ダイス',
  'ココフォリア',
  'サマリー',
  'リソース'
];

export const EditSessionNoteModal: React.FC<EditSessionNoteModalProps> = ({
  isOpen,
  onClose,
  note,
  onSave,
  passkey,
  existingTags = []
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SessionNoteCategory>('用語');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [sourceBook, setSourceBook] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [inlineImageUrlInput, setInlineImageUrlInput] = useState('');
  const [inlineImageAltInput, setInlineImageAltInput] = useState('');
  const [showInlineImagePopover, setShowInlineImagePopover] = useState(false);
  const [previewZoomImage, setPreviewZoomImage] = useState<LightboxImage | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mainImageFileInputRef = useRef<HTMLInputElement>(null);
  const inlineImageFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setCategory(note.category || '用語');
      setDescription(note.description || '');
      setTags(Array.isArray(note.tags) ? [...note.tags] : []);
      setSourceBook(note.sourceBook || '');
      setIsPinned(Boolean(note.isPinned));
      const initialImages = Array.isArray(note.imageUrls) && note.imageUrls.length > 0
        ? [...note.imageUrls]
        : (note.imageUrl ? [note.imageUrl] : []);
      setImageUrls(initialImages);
    } else {
      setTitle('');
      setCategory('用語');
      setDescription('');
      setTags([]);
      setSourceBook('');
      setIsPinned(false);
      setImageUrls([]);
    }
    setImageUrlInput('');
    setNewTagInput('');
    setError(null);
    setActiveTab('edit');
    setShowInlineImagePopover(false);
  }, [note, isOpen]);

  if (!isOpen) return null;

  // Insert or wrap text in textarea
  const insertTextAtCursor = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    const textToInsert = selectedText || defaultText;
    const replacement = `${prefix}${textToInsert}${suffix}`;
    const newDesc = description.substring(0, start) + replacement + description.substring(end);
    setDescription(newDesc);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + replacement.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToInsert.length);
      }
    }, 0);
  };

  // Quick formatting helpers
  const handleInsertBold = () => {
    insertTextAtCursor('**', '**', '太字テキスト');
  };

  // Heading formatting helpers (大見出し・中見出し・見出し構成)
  const handleInsertHeading1 = () => {
    insertTextAtCursor('\n# ', '\n概要や全体の説明をここに記入します。\n', '見出しの題名');
  };

  const handleInsertHeading2 = () => {
    insertTextAtCursor('\n## ', '\n項目の詳細な説明やルールをここに記入します。\n', '項目名');
  };

  const handleInsertHierarchyTemplate = () => {
    const template = `\n# 見出しタイトル\n全体概要や共通ルールについての説明文をここに記入します。\n\n## 項目名\n項目の詳細な説明や具体的な効果、判定方法などを記入します。\n`;
    insertTextAtCursor(template, '', '');
  };

  const handleInsertHeading = () => {
    insertTextAtCursor('\n### ', '\n', '小見出しタイトル');
  };

  // Multiple main attached images upload handler
  const handleMainImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    const validFiles = fileList.filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      setError('画像ファイルを選択してください');
      return;
    }

    const overSized = validFiles.find((f) => f.size > 5 * 1024 * 1024);
    if (overSized) {
      setError('画像サイズは1枚あたり5MB以下にしてください');
      return;
    }

    let loaded = 0;
    const results: string[] = [];

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) results.push(result);
        loaded++;
        if (loaded === validFiles.length) {
          setImageUrls((prev) => [...prev, ...results]);
          setError(null);
        }
      };
      reader.onerror = () => {
        setError('画像の読み込みに失敗しました');
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setImageUrls((prev) => [...prev, trimmed]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAllImages = () => {
    setImageUrls([]);
  };

  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= imageUrls.length) return;
    const next = [...imageUrls];
    const item = next.splice(fromIdx, 1)[0];
    next.splice(toIdx, 0, item);
    setImageUrls(next);
  };

  const handleAttachmentDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    const validFiles = fileList.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const overSized = validFiles.find((f) => f.size > 5 * 1024 * 1024);
    if (overSized) {
      setError('画像サイズは1枚あたり5MB以下にしてください');
      return;
    }

    let loaded = 0;
    const results: string[] = [];

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) results.push(result);
        loaded++;
        if (loaded === validFiles.length) {
          setImageUrls((prev) => [...prev, ...results]);
          setError(null);
        }
      };
      reader.onerror = () => {
        setError('画像の読み込みに失敗しました');
      };
      reader.readAsDataURL(file);
    });
  };

  // Inline image insertion file handler
  const handleInlineImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('画像サイズは5MB以下にしてください');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      insertTextAtCursor(`\n![${cleanName || '挿入画像'}](${result})\n`, '', '');
      setError(null);
    };
    reader.onerror = () => {
      setError('画像の読み込みに失敗しました');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Textarea paste image support (Ctrl+V)
  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          if (file.size > 5 * 1024 * 1024) {
            setError('画像サイズは5MB以下にしてください');
            return;
          }
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            insertTextAtCursor(`\n![クリップボード画像](${result})\n`, '', '');
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }
  };

  // Textarea drag & drop image support
  const handleTextareaDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setError('画像サイズは5MB以下にしてください');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          insertTextAtCursor(`\n![${cleanName || 'ドロップ画像'}](${result})\n`, '', '');
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  const handleInsertBullet = () => {
    insertTextAtCursor('\n・ ', '', '箇条書き項目');
  };

  const handleInsertNumberList = () => {
    insertTextAtCursor('\n1. ', '', 'リスト項目');
  };

  const handleInsertTable = () => {
    const tableTemplate = `\n| **項目名** | **内容・効果** |\n|---|---|\n| 例1 | **太字強調**と説明 |\n| 例2 | 通常テキスト |\n`;
    insertTextAtCursor(tableTemplate, '', '');
  };

  const handleInsertCode = () => {
    insertTextAtCursor('\n```\n', '\n```\n', '1D6>=4 【判定コマンド】');
  };

  // Add tag(s) - supports comma and space separated inputs
  const handleAddTag = (tagToAdd: string) => {
    const candidates = tagToAdd
      .split(/[,、\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (candidates.length === 0) return;

    const nextTags = [...tags];
    candidates.forEach((cand) => {
      if (!nextTags.includes(cand)) {
        nextTags.push(cand);
      }
    });

    setTags(nextTags);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Combined suggested tags (from existing notes + default suggestions)
  const combinedSuggestions = Array.from(
    new Set([...existingTags, ...DEFAULT_SUGGESTED_TAGS])
  ).slice(0, 24);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('題名（タイトル）を入力してください');
      return;
    }

    setSaving(true);
    setError(null);

    const noteToSave: SessionNote = {
      id: note?.id || `note-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim(),
      tags,
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      sourceBook: sourceBook.trim() || undefined,
      isPinned,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await onSave(noteToSave);
      onClose();
    } catch (err: any) {
      setError(err.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-stone-900 border border-amber-900/60 rounded-xl w-full max-w-2xl text-stone-100 shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-900/80 border border-amber-700/60 flex items-center justify-center text-amber-200">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-detective-title text-amber-100">
                {note ? '便利帳項目の編集' : '新規項目の作成'}
              </h2>
              <p className="text-xs text-stone-400">
                セッションで参照する用語、キャラ作成サマリー、小ネタを登録・編集します
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-lg text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-medium text-stone-300 mb-1.5">
              題名（タイトル） <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 余裕（ヨユウ）、【探偵】キャラ作成の流れサマリー、知ってたカードの演出フレーズ集"
              className="w-full px-3 py-2 bg-stone-800/90 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-medium text-sm"
              required
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block font-medium text-stone-300 mb-1.5">分類（カテゴリ）</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.label}
                  onClick={() => setCategory(cat.label)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                    category === cat.label
                      ? 'bg-amber-800/90 text-amber-100 border-amber-600 shadow-xs'
                      : 'bg-stone-800/80 text-stone-400 border-stone-700 hover:bg-stone-750 hover:text-stone-200'
                  }`}
                >
                  <div>{cat.label}</div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-400 mt-1.5">
              {CATEGORIES.find((c) => c.label === category)?.description}
            </p>
          </div>

          {/* Description Section with Rich Formatting Toolbar & Preview Tab */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block font-medium text-stone-300">
                説明・内容 <span className="text-rose-400">*</span>
              </label>

              {/* Edit / Preview Toggle */}
              <div className="flex items-center gap-1 bg-stone-950 p-0.5 rounded-lg border border-stone-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    activeTab === 'edit'
                      ? 'bg-amber-900 text-amber-200 font-bold shadow-2xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>編集</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-amber-900 text-amber-200 font-bold shadow-2xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>プレビュー (太字確認)</span>
                </button>
              </div>
            </div>

            {/* Formatting Toolbar (Active during edit mode) */}
            {activeTab === 'edit' && (
              <div className="space-y-0">
                <div className="flex items-center gap-1 p-1 bg-stone-950/80 border border-stone-750 rounded-t-lg overflow-x-auto text-xs">
                  {/* Hierarchy Buttons Group */}
                  <button
                    type="button"
                    onClick={handleInsertHeading1}
                    className="px-2 py-1 rounded bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-800/80 flex items-center gap-1 transition-colors cursor-pointer shrink-0 font-bold"
                    title="大見出しの題名を挿入 (# 見出しの題名)"
                  >
                    <Heading className="w-3.5 h-3.5 text-amber-400" />
                    <span>大見出し</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertHeading2}
                    className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-800 text-amber-200 border border-amber-900/60 flex items-center gap-1 transition-colors cursor-pointer shrink-0 font-medium"
                    title="中見出し（項目の説明）を挿入 (## 項目名)"
                  >
                    <FolderTree className="w-3.5 h-3.5 text-amber-400/90" />
                    <span>中見出し</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertHierarchyTemplate}
                    className="px-2 py-1 rounded bg-amber-800/70 hover:bg-amber-700 text-amber-100 border border-amber-600/80 flex items-center gap-1 transition-colors cursor-pointer shrink-0 font-bold shadow-2xs mr-1"
                    title="見出しと項目の構成テンプレートを挿入"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>見出し構成</span>
                  </button>

                  <div className="w-px h-4 bg-stone-700 mx-0.5 shrink-0" />

                  {/* Inline Image Insert Button with Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowInlineImagePopover(!showInlineImagePopover)}
                      className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                        showInlineImagePopover
                          ? 'bg-amber-800 text-amber-100 border border-amber-600 font-bold'
                          : 'bg-stone-850 hover:bg-stone-800 text-amber-200 border border-amber-900/60'
                      }`}
                      title="本文に画像を挿入（端末からの画像取り込み・URL指定・クリップボード貼り付け対応）"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>画像挿入</span>
                    </button>

                    {showInlineImagePopover && (
                      <div className="absolute top-full left-0 mt-1 z-30 w-72 bg-stone-900 border border-stone-700 rounded-lg p-3 shadow-2xl space-y-2.5 text-xs text-stone-200">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 font-bold text-amber-200">
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                            <span>本文へ画像を挿入</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowInlineImagePopover(false)}
                            className="text-stone-400 hover:text-stone-100 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              inlineImageFileInputRef.current?.click();
                              setShowInlineImagePopover(false);
                            }}
                            className="w-full py-1.5 px-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>端末から画像を選択して挿入</span>
                          </button>
                          <p className="text-[10px] text-stone-400 text-center mt-1">PNG, JPG, WebP, GIF (5MB以下)</p>
                        </div>
                        <div className="border-t border-stone-800 pt-2 space-y-1.5">
                          <label className="text-[11px] text-stone-400">または画像URLを指定:</label>
                          <input
                            type="url"
                            value={inlineImageUrlInput}
                            onChange={(e) => setInlineImageUrlInput(e.target.value)}
                            placeholder="https://example.com/image.png"
                            className="w-full px-2 py-1 bg-stone-800 border border-stone-700 rounded text-stone-100 text-xs focus:outline-hidden focus:border-amber-500"
                          />
                          <input
                            type="text"
                            value={inlineImageAltInput}
                            onChange={(e) => setInlineImageAltInput(e.target.value)}
                            placeholder="画像の説明（alt / 任意）"
                            className="w-full px-2 py-1 bg-stone-800 border border-stone-700 rounded text-stone-100 text-xs focus:outline-hidden focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (inlineImageUrlInput.trim()) {
                                insertTextAtCursor(`\n![${inlineImageAltInput.trim() || '画像'}](${inlineImageUrlInput.trim()})\n`, '', '');
                                setInlineImageUrlInput('');
                                setInlineImageAltInput('');
                                setShowInlineImagePopover(false);
                              }
                            }}
                            disabled={!inlineImageUrlInput.trim()}
                            className="w-full py-1 bg-stone-800 hover:bg-stone-750 disabled:opacity-50 text-stone-200 border border-stone-700 rounded cursor-pointer transition-colors font-medium"
                          >
                            URL画像を挿入
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-400 border-t border-stone-800 pt-1.5 leading-relaxed">
                          💡 エディタに直接スクリーンショット貼り付け（Ctrl+V）や画像ドラッグ＆ドロップも可能です。
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="w-px h-4 bg-stone-700 mx-0.5 shrink-0" />

                  {/* Bold Button */}
                  <button
                    type="button"
                    onClick={handleInsertBold}
                    className="px-2.5 py-1 rounded bg-stone-850 hover:bg-amber-900/60 text-amber-200 hover:text-amber-100 border border-stone-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="選択テキストを太字にする (**太字**)"
                  >
                    <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="font-bold">太字</span>
                  </button>

                  {/* Heading Button */}
                  <button
                    type="button"
                    onClick={handleInsertHeading}
                    className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="見出しを挿入 (### 見出し)"
                  >
                    <Heading className="w-3.5 h-3.5" />
                    <span>見出し</span>
                  </button>

                  {/* Bullet List Button */}
                  <button
                    type="button"
                    onClick={handleInsertBullet}
                    className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="箇条書きを挿入 (・)"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>箇条書き</span>
                  </button>

                  {/* Number List Button */}
                  <button
                    type="button"
                    onClick={handleInsertNumberList}
                    className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="番号付きリストを挿入 (1. 2.)"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>番号</span>
                  </button>

                  {/* Table Button */}
                  <button
                    type="button"
                    onClick={handleInsertTable}
                    className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="表組みテンプレートを挿入"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>表組み</span>
                  </button>

                  {/* Code Button */}
                  <button
                    type="button"
                    onClick={handleInsertCode}
                    className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="コマンド・コードブロックを挿入"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>コード</span>
                  </button>
                </div>

                {/* Hierarchy Guidance Bar */}
                <div className="px-2.5 py-1 bg-stone-900 border-x border-b border-stone-750 text-[11px] text-stone-300 flex items-center justify-between gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                    <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>見出し構成：</span>
                    <span className="text-amber-100 font-bold bg-amber-900/60 px-1 rounded">大見出し（題名）</span>
                    <span className="text-stone-500">→</span>
                    <span className="text-amber-200 font-bold bg-amber-800/40 px-1 rounded">中見出し（説明）</span>
                  </span>
                  <span className="text-stone-400 text-[10px]">
                    ※「見出し構成」ボタンでテンプレートが挿入されます
                  </span>
                </div>
              </div>
            )}

            {/* Textarea or Preview Area */}
            {activeTab === 'edit' ? (
              <textarea
                ref={textareaRef}
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onPaste={handleTextareaPaste}
                onDrop={handleTextareaDrop}
                placeholder="用語の意味、効果、キャラ作成のステップ、セッションでの演出のコツなどを記入します。&#10;・「大見出し」「中見出し」ボタンで全体の題名と各項目の説明をきれいに整理できます。&#10;・「画像挿入」や添付画像エリア、ドラッグ＆ドロップ、クリップボード貼り付け（Ctrl+V）で複数の画像を取り込めます。&#10;・**太字にしたいテキスト** で囲むと太字になります。&#10;・改行や箇条書き（・や1. 2.）、| 表組み | もきれいに整形表示されます。"
                className="w-full px-3 py-2.5 bg-stone-800/90 border border-stone-700 rounded-b-lg text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors leading-relaxed font-mono sm:font-sans text-xs sm:text-sm"
                required
              />
            ) : (
              <div className="min-h-[160px] p-4 bg-stone-950/80 border border-stone-700 rounded-lg text-stone-200 overflow-y-auto max-h-60">
                {description.trim() ? (
                  <FormattedNoteContent content={description} />
                ) : (
                  <span className="text-stone-500 text-xs italic">
                    プレビューする内容がありません
                  </span>
                )}
              </div>
            )}

            <div className="text-[11px] text-stone-400 flex flex-wrap items-center justify-between gap-1 mt-1">
              <span>
                💡 <strong>**太字**</strong> で囲むか、上部の「<strong className="text-amber-300">B 太字</strong>」ボタンでテキストを太字強調できます
              </span>
              <span>{description.length}文字</span>
            </div>
          </div>

          {/* Tags Section with Enhanced Editing & Quantity Control */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block font-medium text-stone-300">
                タグ（検索・分類用）
                <span className="text-xs text-stone-400 font-normal ml-1.5">
                  ({tags.length}個設定中)
                </span>
              </label>

              {tags.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTags([])}
                  className="text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  タグをすべてクリア
                </button>
              )}
            </div>

            {/* Current Tags Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[34px] p-2 bg-stone-950/60 rounded-lg border border-stone-800">
              {tags.length === 0 ? (
                <span className="text-xs text-stone-500 italic py-0.5">
                  タグが設定されていません（下のおすすめタグや自由入力で追加してください）
                </span>
              ) : (
                tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/80 text-amber-200 border border-amber-800/80 text-xs font-medium"
                  >
                    <Tag className="w-3 h-3 text-amber-400" />
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-amber-400 hover:text-rose-300 p-0.5 ml-0.5 cursor-pointer"
                      title={`タグ「#${t}」を外す`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Tag Input (supports comma/space separation) */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(newTagInput);
                  }
                }}
                placeholder="タグ名を入力してEnter（カンマ区切りで複数一括登録可能）"
                className="flex-1 px-3 py-1.5 bg-stone-800/90 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAddTag(newTagInput)}
                className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg text-stone-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>追加</span>
              </button>
            </div>

            {/* Suggested / Available Tags Chips */}
            <div className="mt-2 pt-1">
              <span className="text-[11px] text-stone-400 block mb-1">
                よく使うタグ（クリックで追加 / 解除）:
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {combinedSuggestions.map((st) => {
                  const isSelected = tags.includes(st);
                  return (
                    <button
                      type="button"
                      key={st}
                      onClick={() => (isSelected ? handleRemoveTag(st) : handleAddTag(st))}
                      className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-900/60 text-amber-300 border-amber-700/80 font-bold'
                          : 'bg-stone-800/60 text-stone-400 border-stone-700/60 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Note Multiple Images Attachment Section */}
          <div className="space-y-2 pt-2 border-t border-stone-800">
            <div className="flex items-center justify-between">
              <label className="font-medium text-stone-300 flex items-center gap-1.5 text-xs sm:text-sm">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>添付画像（図表・資料・写真等 / 複数追加可）</span>
                {imageUrls.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                    {imageUrls.length}枚登録済
                  </span>
                )}
              </label>
              {imageUrls.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllImages}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>すべて解除</span>
                </button>
              )}
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleAttachmentDrop}
              className="p-3 bg-stone-950/70 border border-stone-800 rounded-lg space-y-3"
            >
              {/* If images are attached, show thumbnail gallery */}
              {imageUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg overflow-hidden border border-stone-700 bg-stone-900 group aspect-4/3 shadow-xs"
                      >
                        <img
                          src={url}
                          alt={`添付画像 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-stone-950/85 text-amber-300 text-[10px] font-mono font-bold shadow-xs">
                          #{idx + 1}
                        </div>

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-stone-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, idx - 1)}
                              title="前へ移動"
                              className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 cursor-pointer transition-colors"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setPreviewZoomImage({ src: url, alt: `添付画像 #${idx + 1}` })}
                            title="拡大表示"
                            className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-400 cursor-pointer transition-colors"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          {idx < imageUrls.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, idx + 1)}
                              title="次へ移動"
                              className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 cursor-pointer transition-colors"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            title="削除"
                            className="p-1 rounded bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-800 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-stone-400">
                    カード上に複数の画像が表示され、クリックで拡大プレビューできます。矢印ボタンで並び順を変更できます。
                  </p>
                </div>
              )}

              {/* Upload & URL Input controls */}
              <div className="pt-2 border-t border-stone-850 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                      imageInputMode === 'upload'
                        ? 'bg-amber-900 text-amber-200 font-bold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    端末から追加 (複数可)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                      imageInputMode === 'url'
                        ? 'bg-amber-900 text-amber-200 font-bold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    画像URLから追加
                  </button>
                </div>

                {imageInputMode === 'upload' ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => mainImageFileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-lg border-2 border-dashed border-stone-750 hover:border-amber-600 bg-stone-900/50 hover:bg-stone-850/60 text-stone-300 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer group"
                    >
                      <Upload className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-xs text-stone-200">
                        {imageUrls.length > 0 ? 'さらに端末から画像を選択して追加（複数選択可）' : '端末から画像を選択して取り込む（複数選択可）'}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        ドラッグ＆ドロップ対応・PNG, JPG, WebP, GIF (1枚あたり5MB以下)
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      placeholder="https://example.com/image.png (入力して「追加」)"
                      className="flex-1 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!imageUrlInput.trim()}
                      className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 disabled:bg-stone-800 text-white disabled:text-stone-500 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>追加</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            multiple
            ref={mainImageFileInputRef}
            onChange={handleMainImagesUpload}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={inlineImageFileInputRef}
            onChange={handleInlineImageUpload}
            accept="image/*"
            className="hidden"
          />

          <ImageLightboxModal
            image={previewZoomImage}
            onClose={() => setPreviewZoomImage(null)}
          />

          {/* Source Book & Pin Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-800">
            <div>
              <label className="block font-medium text-stone-300 mb-1">出典・参照書籍（任意）</label>
              <input
                type="text"
                value={sourceBook}
                onChange={(e) => setSourceBook(e.target.value)}
                placeholder="例: 基本ルールブック p.24、探偵たちの駆ける道"
                className="w-full px-3 py-1.5 bg-stone-800/90 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-700 text-amber-600 focus:ring-amber-500 focus:ring-offset-stone-900"
                />
                <span className="font-medium text-stone-200 text-xs sm:text-sm flex items-center gap-1">
                  <Bookmark className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-400 fill-amber-400' : 'text-stone-400'}`} />
                  <span>この項目を上部にピン留めする</span>
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-stone-800 bg-stone-950/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{saving ? '保存中...' : note ? '変更を保存' : '項目を登録'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
