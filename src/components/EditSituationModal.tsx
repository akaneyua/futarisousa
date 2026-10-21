import React, { useState } from 'react';
import { SituationInvestigation, TableEventItem, SituationCategory, ActorType, SituationVersatility } from '../types.ts';
import { INITIAL_SOURCE_BOOKS, INITIAL_TAG_LIST } from '../initialData.ts';
import { X, Save, Plus, Trash2, AlertCircle, Book, Compass, Sparkles } from 'lucide-react';

interface EditSituationModalProps {
  situation: SituationInvestigation | null;
  onClose: () => void;
  onSave: (situation: SituationInvestigation) => Promise<void>;
  passkey: string;
}

export const EditSituationModal: React.FC<EditSituationModalProps> = ({
  situation,
  onClose,
  onSave,
  passkey,
}) => {
  const isNew = !situation || !situation.id;

  const [name, setName] = useState(situation?.name || '');
  const [abbreviation, setAbbreviation] = useState(situation?.abbreviation || '');
  const [category, setCategory] = useState<SituationCategory>(situation?.category || 'その他のシチュエーション');
  const [versatility, setVersatility] = useState<SituationVersatility>(() => {
    if (situation?.versatility) {
      if ((situation.versatility as string) === '高') return 'あり';
      if ((situation.versatility as string) === '中') return '条件付きあり';
      if ((situation.versatility as string) === '特殊') return '条件付きなし';
      if ((situation.versatility as string) === '低') return 'なし';
      return situation.versatility;
    }
    return '条件付きあり';
  });

  // 書籍① (サプリメント・初出書籍など)
  const initialSourceBookIsCustom = situation?.sourceBook && !INITIAL_SOURCE_BOOKS.includes(situation.sourceBook);
  const [sourceBook, setSourceBook] = useState(
    initialSourceBookIsCustom ? '__custom__' : (situation?.sourceBook || '基本ルールブック')
  );
  const [customBook, setCustomBook] = useState(initialSourceBookIsCustom ? situation.sourceBook : '');
  const [page, setPage] = useState(situation?.page || 'P.');

  // 書籍② (大判ルールブック・併記書籍など)
  const initialSourceBook2IsCustom = situation?.sourceBook2 && !INITIAL_SOURCE_BOOKS.includes(situation.sourceBook2);
  const [sourceBook2, setSourceBook2] = useState(
    situation?.sourceBook2
      ? initialSourceBook2IsCustom
        ? '__custom__'
        : situation.sourceBook2
      : ''
  );
  const [customBook2, setCustomBook2] = useState(initialSourceBook2IsCustom ? situation.sourceBook2 : '');
  const [page2, setPage2] = useState(situation?.page2 || '');

  const [summary, setSummary] = useState(situation?.summary || '');
  const [usageTiming, setUsageTiming] = useState(situation?.usageTiming || '');
  const [actorType, setActorType] = useState<ActorType>(situation?.actorType || '二人で使う');
  const [tags, setTags] = useState<string[]>(situation?.tags || ['二人で使う']);
  const [newTagInput, setNewTagInput] = useState('');

  // 1〜6の表イベントを初期化（常に1〜6の6項目を準備）
  const [tableEvents, setTableEvents] = useState<TableEventItem[]>(() => {
    const existing = situation?.tableEvents || [];
    const map = new Map<number, TableEventItem>();
    existing.forEach((item) => map.set(item.roll, item));
    const list: TableEventItem[] = [];
    for (let r = 1; r <= 6; r++) {
      const found = map.get(r);
      list.push(
        found
          ? {
              roll: r,
              title: found.title || '',
              summary: found.summary || '',
              description: found.description || found.extendedDescription || '',
              process: found.process || '',
              recurring: found.recurring || '',
            }
          : {
              roll: r,
              title: '',
              summary: '',
              description: '',
              process: '',
              recurring: '',
            }
      );
    }
    return list;
  });

  // 編集中の出目タブ (1〜6、または 0 で「すべて表示」)
  const [activeRollTab, setActiveRollTab] = useState<number>(1);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form state when situation prop changes (prevents showing data from a previously opened situation)
  React.useEffect(() => {
    setName(situation?.name || '');
    setAbbreviation(situation?.abbreviation || '');
    setCategory(situation?.category || 'その他のシチュエーション');
    setVersatility(() => {
      if (situation?.versatility) {
        if ((situation.versatility as string) === '高') return 'あり';
        if ((situation.versatility as string) === '中') return '条件付きあり';
        if ((situation.versatility as string) === '特殊') return '条件付きなし';
        if ((situation.versatility as string) === '低') return 'なし';
        return situation.versatility;
      }
      return '条件付きあり';
    });

    const isBook1Custom = Boolean(situation?.sourceBook && !INITIAL_SOURCE_BOOKS.includes(situation.sourceBook));
    setSourceBook(isBook1Custom ? '__custom__' : (situation?.sourceBook || '基本ルールブック'));
    setCustomBook(isBook1Custom && situation?.sourceBook ? situation.sourceBook : '');
    setPage(situation?.page || 'P.');

    const isBook2Custom = Boolean(situation?.sourceBook2 && !INITIAL_SOURCE_BOOKS.includes(situation.sourceBook2));
    setSourceBook2(situation?.sourceBook2 ? (isBook2Custom ? '__custom__' : situation.sourceBook2) : '');
    setCustomBook2(isBook2Custom && situation?.sourceBook2 ? situation.sourceBook2 : '');
    setPage2(situation?.page2 || '');

    setSummary(situation?.summary || '');
    setUsageTiming(situation?.usageTiming || '');
    setActorType(situation?.actorType || '二人で使う');
    setTags(situation?.tags || ['二人で使う']);

    const existing = situation?.tableEvents || [];
    const map = new Map<number, TableEventItem>();
    existing.forEach((item) => map.set(item.roll, item));
    const list: TableEventItem[] = [];
    for (let r = 1; r <= 6; r++) {
      const found = map.get(r);
      list.push(
        found
          ? {
              roll: r,
              title: found.title || '',
              summary: found.summary || '',
              description: found.description || found.extendedDescription || '',
              process: found.process || '',
              recurring: found.recurring || '',
            }
          : {
              roll: r,
              title: '',
              summary: '',
              description: '',
              process: '',
              recurring: '',
            }
      );
    }
    setTableEvents(list);
  }, [situation]);

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().replace(/^#/, '');
    if (!tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setNewTagInput('');
  };

  const handleTableChange = (
    rollNumber: number,
    field: 'title' | 'summary' | 'description' | 'process' | 'recurring',
    val: string
  ) => {
    setTableEvents((prev) =>
      prev.map((item) =>
        item.roll === rollNumber ? { ...item, [field]: val } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('シチュエーション名を入力してください');
      return;
    }

    const finalBook1 = sourceBook === '__custom__' ? (customBook.trim() || 'その他') : sourceBook;
    const finalBook2 =
      sourceBook2 === '__none__' || !sourceBook2
        ? ''
        : sourceBook2 === '__custom__'
        ? customBook2.trim()
        : sourceBook2;

    // 入力のある表イベントのみ抽出（あるいは6行全て）
    const cleanedTableEvents = tableEvents.filter(
      (ev) =>
        ev.title.trim() ||
        ev.summary?.trim() ||
        ev.description.trim() ||
        ev.process?.trim() ||
        ev.recurring?.trim()
    );

    const situationData: SituationInvestigation = {
      id: situation?.id || `situation-${Date.now()}`,
      name: name.trim(),
      abbreviation: abbreviation.trim() || undefined,
      category,
      sourceBook: finalBook1,
      page: page.trim(),
      sourceBook2: finalBook2 ? finalBook2 : undefined,
      page2: finalBook2 && page2.trim() ? page2.trim() : undefined,
      summary: summary.trim(),
      versatility,
      usageTiming: usageTiming.trim(),
      actorType,
      tags,
      tableEvents: cleanedTableEvents.length > 0 ? cleanedTableEvents : undefined,
    };

    setSaving(true);
    try {
      await onSave(situationData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="edit-situation-overlay"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex justify-center items-center p-3 md:p-6"
    >
      <div
        id="edit-situation-modal"
        className="w-full max-w-3xl bg-stone-50 rounded-xl shadow-2xl border border-stone-300 max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div>
            <h2 className="text-lg font-bold font-serif">
              {isNew ? '新しいシチュエーションの追加' : `「${situation.name}」の編集`}
            </h2>
            <p className="text-xs text-stone-400">
              描写や使用タイミング、1d6表を更新して共有データベースへ保存します
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-stone-800 text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center text-xs">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Name, Abbreviation & Category */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                シチュエーション名 <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 現場にて、閉鎖空間"
                required
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span>捜査方法の略称</span>
                <span className="text-[10px] text-amber-800 bg-amber-100/90 px-1 py-0.2 rounded font-normal">
                  タッチコピー対応
                </span>
              </label>
              <input
                type="text"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                placeholder="例: 現場、なぜ、閉鎖"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                ※カード上でタッチするとコピーできます
              </p>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                分類区分
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SituationCategory)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="共通">共通（基本5種）</option>
                <option value="その他のシチュエーション">その他のシチュエーション</option>
              </select>
            </div>
          </div>

          {/* Row 2: Dual Source Books & Pages (サプリメント／大判ルルブなど2箇所入力可能) */}
          <div className="p-3.5 sm:p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5 font-serif">
                <Book className="w-3.5 h-3.5 text-amber-800" />
                ルールブック表記・掲載ページ（サプリ／大判ルルブの2箇所入力可能）
              </label>
              <span className="text-[11px] text-stone-500 font-serif">
                ※片方のみ、または両方入力できます
              </span>
            </div>

            {/* 書籍① (サプリメント・初出書籍など) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  書籍①（サプリメント・初出書籍など）
                </label>
                <div className="flex gap-2">
                  <select
                    value={sourceBook}
                    onChange={(e) => setSourceBook(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs font-serif"
                  >
                    {INITIAL_SOURCE_BOOKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="__custom__">その他（直接入力）</option>
                  </select>
                  {sourceBook === '__custom__' && (
                    <input
                      type="text"
                      value={customBook}
                      onChange={(e) => setCustomBook(e.target.value)}
                      placeholder="書籍名を入力"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs font-serif"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  掲載ページ①
                </label>
                <input
                  type="text"
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  placeholder="例: P.70"
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs font-serif"
                />
              </div>
            </div>

            {/* 書籍② (大判ルルブ・併記書籍など) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2.5 border-t border-amber-200/60">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  書籍②（大判ルルブ・併記書籍など）
                </label>
                <div className="flex gap-2">
                  <select
                    value={sourceBook2}
                    onChange={(e) => setSourceBook2(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs font-serif"
                  >
                    <option value="">（なし / 1箇所のみ）</option>
                    {INITIAL_SOURCE_BOOKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="__custom__">その他（直接入力）</option>
                  </select>
                  {sourceBook2 === '__custom__' && (
                    <input
                      type="text"
                      value={customBook2}
                      onChange={(e) => setCustomBook2(e.target.value)}
                      placeholder="大判書籍名などを入力"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs font-serif"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  掲載ページ②
                </label>
                <input
                  type="text"
                  value={page2}
                  onChange={(e) => setPage2(e.target.value)}
                  placeholder="例: P.128"
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs font-serif"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Actor Type */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              参加形態（誰が使うか）
            </label>
            <div className="flex flex-wrap gap-2">
              {(['二人で使う', '探偵だけ', '助手だけ', 'NPCが登場する'] as ActorType[]).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setActorType(type)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    actorType === type
                      ? 'bg-amber-800 text-white border-amber-800'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Row 4: Versatility (汎用性) */}
          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-700" />
                汎用性（使いやすさの目安）
              </label>
              <span className="text-[11px] text-stone-500 font-serif">
                早見一覧で絞り込み・目安として表示されます
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { val: 'あり', desc: 'どんな事件でも使える王道' },
                { val: '条件付きあり', desc: '状況・手がかりに応じて活躍' },
                { val: '条件付きなし', desc: '条件合致時・特殊展開専用' },
                { val: 'なし', desc: '極めて限定的な場面専用' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setVersatility(item.val as SituationVersatility)}
                  className={`px-2 py-2 rounded-md border text-xs font-serif flex flex-col items-center transition-all ${
                    versatility === item.val
                      ? 'bg-amber-800 text-white border-amber-900 shadow-xs ring-2 ring-amber-600/50'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <span className="font-bold">{item.val}</span>
                  <span className="text-[10px] opacity-75 truncate max-w-full mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 5: Summary */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              概要（簡潔な説明・シチュエーションの目的）
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="例: 事件が起きた現場や発見場所を二人でじっくり調査する王道捜査。"
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
            />
          </div>

          {/* Row 6: どんな状況で使うものなのか */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              どんな状況で使うものなのか（使用タイミング・シチュエーション）
            </label>
            <textarea
              rows={2}
              value={usageTiming}
              onChange={(e) => setUsageTiming(e.target.value)}
              placeholder="例: 事件が発生した直後や、死体発見現場・荒らされた部屋など「物理的な証拠や痕跡」が残されている場所を訪れたとき。"
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs leading-relaxed"
            />
          </div>

          {/* Row 7: 1d6 Table Events (出目1〜6の全6項目) */}
          <div className="border border-stone-300 rounded-xl p-4 bg-amber-50/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-200">
              <div>
                <h4 className="text-xs font-bold text-stone-900 font-serif flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  シチュエーション捜査表（出目1〜6：全6項目）
                </h4>
                <p className="text-[11px] text-stone-500 font-serif">
                  各出目の「題名」「描写」「処理」「再発生」を入力・編集できます
                </p>
              </div>

              {/* Roll Selector Tabs */}
              <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-lg">
                {[1, 2, 3, 4, 5, 6].map((roll) => {
                  const ev = tableEvents.find((i) => i.roll === roll);
                  const hasContent = Boolean(ev?.title || ev?.description || ev?.process);
                  return (
                    <button
                      key={roll}
                      type="button"
                      onClick={() => setActiveRollTab(roll)}
                      className={`px-2.5 py-1 text-xs font-serif font-bold rounded transition-all flex items-center gap-1 ${
                        activeRollTab === roll
                          ? 'bg-amber-850 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                      }`}
                    >
                      <span>{roll}</span>
                      {hasContent && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setActiveRollTab(0)}
                  className={`px-2 py-1 text-[11px] font-serif rounded transition-all ${
                    activeRollTab === 0
                      ? 'bg-stone-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  すべて表示
                </button>
              </div>
            </div>

            {/* Table Event Cards */}
            <div className="space-y-4">
              {tableEvents
                .filter((ev) => activeRollTab === 0 || ev.roll === activeRollTab)
                .map((row) => (
                  <div
                    key={row.roll}
                    className="p-3.5 sm:p-4 bg-white border border-stone-300 rounded-xl space-y-3 shadow-xs"
                  >
                    {/* Header: Roll badge and Title */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-2 border-b border-stone-200">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-typewriter font-bold text-amber-900 bg-amber-100 border border-amber-300 text-sm shadow-2xs shrink-0">
                          {row.roll}
                        </span>
                        <span className="text-xs font-bold text-stone-700 font-serif shrink-0">
                          出目 {row.roll} 題名:
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="例: 気になるもの、不審な足跡"
                        value={row.title}
                        onChange={(e) => handleTableChange(row.roll, 'title', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md text-xs font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Section: ●概要 */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-800 mb-1 font-serif flex items-center gap-1">
                        <span className="text-amber-800">●概要</span>
                        <span className="text-stone-400 font-normal">（状況の概略・何が起きるか・探偵たちの行動目的）</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="事件現場を洗い直します。そんなとき、探偵は気になるものを発見しました。詳しく調べてみると、事件に繋がる何かを見つけ出すことができるかもしれません。"
                        value={row.summary || ''}
                        onChange={(e) => handleTableChange(row.roll, 'summary', e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md text-xs font-serif leading-relaxed text-stone-850 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Section: ●描写 */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-800 mb-1 font-serif flex items-center gap-1">
                        <span className="text-amber-700">●描写</span>
                        <span className="text-stone-400 font-normal">（状況や情景、探偵たちの様子の描写テキスト）</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="事件の起きた現場は、まだ残されている。ここで起きた「何か」は、霧の向こうに隠されていた。その霧に手を突っ込む者たちがいる。"
                        value={row.description}
                        onChange={(e) => handleTableChange(row.roll, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md text-xs font-serif leading-relaxed text-stone-850 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Section: ●処理 */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-800 mb-1 font-serif flex items-center gap-1">
                        <span className="text-amber-700">●処理</span>
                        <span className="text-stone-400 font-normal">（判定技能、有利/不利、キーワード獲得などのルール処理）</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="PCたちは現場を見て回っています。判定を行います。技能は《現場》もしくは「何か」に関連する技能です。探偵はこの判定に有利を得ます。成功するとキーワードを1個獲得します。"
                        value={row.process || ''}
                        onChange={(e) => handleTableChange(row.roll, 'process', e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md text-xs font-serif leading-relaxed text-stone-850 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Section: ●再発生 */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-800 mb-1 font-serif flex items-center gap-1">
                        <span className="text-amber-700">●再発生</span>
                        <span className="text-stone-400 font-normal">（このイベントが2回目以降の場合の処理や展開）</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="このイベントが2回目以降の場合、「現場百回」という言葉があるように、PCたちは調査のため再び現場を訪れます。成功すればまた違うキーワードを1個獲得できます。"
                        value={row.recurring || ''}
                        onChange={(e) => handleTableChange(row.roll, 'recurring', e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md text-xs font-serif leading-relaxed text-stone-850 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Row 8: Tags */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              検索用タグ
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {INITIAL_TAG_LIST.map((tag) => {
                const isSelected = tags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-amber-100 border-amber-400 text-amber-900 font-medium'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            {/* Custom tag input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="新しいタグを追加 (例: 潜入, カフェ)"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag(e);
                  }
                }}
                className="w-48 px-2.5 py-1 text-xs bg-white border border-stone-300 rounded focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1 bg-stone-200 text-stone-700 hover:bg-stone-300 rounded text-xs font-medium"
              >
                タグ追加
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-stone-100 px-6 py-3 border-t border-stone-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-1.5 text-stone-600 hover:text-stone-900 text-xs font-medium"
          >
            キャンセル
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? '保存中…' : 'オンライン共有データベースに保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
