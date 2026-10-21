import React, { useState, useMemo } from 'react';
import {
  Star,
  Search,
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  Table as TableIcon,
  Columns,
  ListOrdered,
  Sparkles,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Filter
} from 'lucide-react';
import { SituationInvestigation, TableEvent } from '../types.ts';

interface SituationContentTableViewProps {
  situations: SituationInvestigation[];
  selectedSituationId?: string;
  favorites: string[];
  onSelect: (sit: SituationInvestigation) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

type ContentDisplayMode = 'matrix' | 'records';

export const SituationContentTableView: React.FC<SituationContentTableViewProps> = ({
  situations,
  selectedSituationId,
  favorites,
  onSelect,
  onToggleFavorite,
}) => {
  const [displayMode, setDisplayMode] = useState<ContentDisplayMode>('matrix');
  const [contentSearch, setContentSearch] = useState('');
  const [selectedRollFilter, setSelectedRollFilter] = useState<number | 'all'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyEvent = (sitName: string, ev: TableEvent, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `【${sitName}】出目${ev.roll}: ${ev.title}\n${ev.description}${ev.process ? `\n【判定・処理】${ev.process}` : ''}${ev.recurring ? `\n【再発生】${ev.recurring}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  // Filter situations based on internal content search
  const filteredSituations = useMemo(() => {
    if (!contentSearch.trim()) return situations;
    const q = contentSearch.toLowerCase().trim();
    return situations.filter((s) => {
      if (s.name.toLowerCase().includes(q)) return true;
      if (s.summary && s.summary.toLowerCase().includes(q)) return true;
      return (s.tableEvents || []).some((ev) => {
        return (
          ev.title.toLowerCase().includes(q) ||
          ev.description.toLowerCase().includes(q) ||
          (ev.process && ev.process.toLowerCase().includes(q)) ||
          (ev.recurring && ev.recurring.toLowerCase().includes(q))
        );
      });
    });
  }, [situations, contentSearch]);

  // Flattened records for the 'records' mode
  const contentRecords = useMemo(() => {
    const list: {
      situation: SituationInvestigation;
      event: TableEvent;
      key: string;
    }[] = [];

    filteredSituations.forEach((sit) => {
      const events = sit.tableEvents || [];
      // If tableEvents is empty, generate standard placeholders
      const normalizedEvents: TableEvent[] = [1, 2, 3, 4, 5, 6].map((roll) => {
        const found = events.find((e) => e.roll === roll);
        if (found) return found;
        return {
          roll,
          title: `出目 ${roll}`,
          description: sit.summary || '（詳細内容未登録）',
          process: sit.usageTiming || '',
          recurring: ''
        };
      });

      normalizedEvents.forEach((ev) => {
        if (selectedRollFilter !== 'all' && ev.roll !== selectedRollFilter) return;

        if (contentSearch.trim()) {
          const q = contentSearch.toLowerCase().trim();
          const match =
            sit.name.toLowerCase().includes(q) ||
            ev.title.toLowerCase().includes(q) ||
            ev.description.toLowerCase().includes(q) ||
            (ev.process && ev.process.toLowerCase().includes(q)) ||
            (ev.recurring && ev.recurring.toLowerCase().includes(q));
          if (!match) return;
        }

        list.push({
          situation: sit,
          event: ev,
          key: `${sit.id}-roll-${ev.roll}`
        });
      });
    });

    return list;
  }, [filteredSituations, selectedRollFilter, contentSearch]);

  const getRollBadgeColor = (roll: number) => {
    switch (roll) {
      case 1:
        return 'bg-rose-900 text-rose-100 border-rose-700';
      case 2:
        return 'bg-amber-800 text-amber-100 border-amber-600';
      case 3:
        return 'bg-emerald-900 text-emerald-100 border-emerald-700';
      case 4:
        return 'bg-sky-900 text-sky-100 border-sky-700';
      case 5:
        return 'bg-indigo-900 text-indigo-100 border-indigo-700';
      case 6:
        return 'bg-purple-900 text-purple-100 border-purple-700';
      default:
        return 'bg-stone-800 text-stone-100 border-stone-600';
    }
  };

  return (
    <div className="space-y-3.5 select-none animate-in fade-in">
      {/* Control & Filter Header */}
      <div className="bg-white rounded-xl border border-stone-300 p-3 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-900 text-amber-100">
              <TableIcon className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-1.5">
                <span>シチュエーション捜査【内容一覧表】</span>
                <span className="text-[11px] font-sans px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200">
                  {filteredSituations.length}件
                </span>
              </h2>
              <p className="text-[11px] text-stone-500">
                出目1〜6の情景描写・判定処理・再発生ルールを表形式で横断閲覧・検索・コピーできます
              </p>
            </div>
          </div>

          {/* Sub-View Switcher: Matrix vs Records */}
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-300 text-xs font-serif">
            <button
              type="button"
              onClick={() => setDisplayMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                displayMode === 'matrix'
                  ? 'bg-amber-900 text-amber-100 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="シチュエーションごとの1D6マトリクス一覧"
            >
              <Columns className="w-3.5 h-3.5 text-amber-400" />
              <span>横断マトリクス表</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('records')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                displayMode === 'records'
                  ? 'bg-amber-900 text-amber-100 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="全出目を1行ずつ並べた詳細レコード表"
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
              <span>出目レコード表 ({contentRecords.length}件)</span>
            </button>
          </div>
        </div>

        {/* Search & Dice Filter Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-stone-200">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={contentSearch}
              onChange={(e) => setContentSearch(e.target.value)}
              placeholder="描写テキスト・判定技能（『観察』等）・題名で内容検索..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-850 placeholder:text-stone-400 focus:outline-hidden focus:border-amber-600 focus:bg-white"
            />
            {contentSearch && (
              <button
                type="button"
                onClick={() => setContentSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dice Filter (especially useful in Records mode) */}
          <div className="flex items-center gap-1 text-xs flex-wrap">
            <span className="text-[11px] text-stone-500 font-serif mr-1 flex items-center gap-0.5">
              <Filter className="w-3 h-3 text-stone-400" />
              <span>出目絞り込み:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedRollFilter('all')}
              className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer border ${
                selectedRollFilter === 'all'
                  ? 'bg-amber-950 text-amber-100 font-bold border-amber-800'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
              }`}
            >
              全出目 (1〜6)
            </button>
            {[1, 2, 3, 4, 5, 6].map((roll) => (
              <button
                key={roll}
                type="button"
                onClick={() => setSelectedRollFilter(selectedRollFilter === roll ? 'all' : roll)}
                className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors cursor-pointer border ${
                  selectedRollFilter === roll
                    ? getRollBadgeColor(roll)
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
                }`}
                title={`出目 ${roll} のみ表示`}
              >
                {roll}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MATRIX VIEW */}
      {displayMode === 'matrix' && (
        <div className="bg-white rounded-xl shadow-xs border border-stone-300 overflow-hidden">
          <div className="overflow-x-auto max-h-[75vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-850 text-stone-200 sticky top-0 z-20 shadow-2xs text-[11px] font-serif">
                <tr>
                  <th className="py-2.5 px-3 min-w-[200px] max-w-[240px] border-r border-stone-700 sticky left-0 z-30 bg-stone-900">
                    シチュエーション名 / 基本情報
                  </th>
                  {[1, 2, 3, 4, 5, 6].map((roll) => (
                    <th
                      key={roll}
                      className={`py-2 px-3 min-w-[240px] max-w-[320px] border-r border-stone-700 font-serif ${
                        selectedRollFilter === roll ? 'bg-amber-950 text-amber-300 ring-2 ring-amber-400 inset-0' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs border ${getRollBadgeColor(roll)}`}>
                            {roll}
                          </span>
                          <span className="font-bold text-stone-100">出目 {roll}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-sans">1D6={roll}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredSituations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-500 font-serif text-sm">
                      該当するシチュエーション内容が見つかりませんでした。
                    </td>
                  </tr>
                ) : (
                  filteredSituations.map((sit, sitIdx) => {
                    const isSelected = selectedSituationId === sit.id;
                    const isFav = favorites.includes(sit.id);

                    const eventsMap = new Map<number, TableEvent>();
                    (sit.tableEvents || []).forEach((e) => eventsMap.set(e.roll, e));

                    return (
                      <tr
                        key={sit.id}
                        className={`transition-colors hover:bg-amber-50/50 ${
                          isSelected ? 'bg-amber-100/60' : sitIdx % 2 === 1 ? 'bg-stone-50/40' : 'bg-white'
                        }`}
                      >
                        {/* Situation Info Column (Sticky Left) */}
                        <td className="py-3 px-3.5 border-r border-stone-200 align-top sticky left-0 z-10 bg-inherit shadow-2xs">
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() => onSelect(sit)}
                                className="font-serif font-bold text-stone-900 text-sm hover:text-amber-800 text-left cursor-pointer leading-tight"
                              >
                                {sit.name}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => onToggleFavorite(sit.id, e)}
                                className="text-stone-300 hover:text-amber-500 cursor-pointer p-0.5"
                                title={isFav ? 'お気に入り解除' : 'お気に入り登録'}
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    isFav ? 'fill-amber-400 text-amber-500' : ''
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex items-center gap-1 flex-wrap text-[10px]">
                              <span className={`px-1.5 py-0.2 rounded border font-serif ${
                                sit.category === '共通'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-stone-100 text-stone-700 border-stone-300'
                              }`}>
                                {sit.category}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 border border-stone-200 font-serif">
                                {sit.actorType}
                              </span>
                              {sit.versatility && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  汎用性:{sit.versatility}
                                </span>
                              )}
                            </div>

                            {sit.sourceBook && (
                              <div className="text-[10px] text-stone-500 font-serif flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-stone-400 shrink-0" />
                                <span className="truncate">{sit.sourceBook} {sit.page ? `P.${sit.page}` : ''}</span>
                              </div>
                            )}

                            {sit.summary && (
                              <div className="text-[11px] text-stone-700 leading-snug border-t border-stone-150 pt-1 select-text">
                                <span className="font-bold text-amber-950 block text-[10px]">【概要】</span>
                                {sit.summary}
                              </div>
                            )}

                            {sit.usageTiming && (
                              <div className="text-[10px] text-stone-900 bg-amber-50/80 p-1.5 rounded border border-amber-200/80 leading-snug select-text">
                                <span className="font-bold text-amber-900 block text-[9px]">【使用タイミング】</span>
                                {sit.usageTiming}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => onSelect(sit)}
                              className="w-full mt-1 px-2 py-1 bg-white hover:bg-amber-100 text-stone-700 hover:text-amber-950 border border-stone-300 rounded text-[10px] font-serif font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <ExternalLink className="w-3 h-3 text-amber-700" />
                              <span>調書を開く</span>
                            </button>
                          </div>
                        </td>

                        {/* Rolls 1 through 6 */}
                        {[1, 2, 3, 4, 5, 6].map((roll) => {
                          const ev = eventsMap.get(roll) || {
                            roll,
                            title: `出目 ${roll}`,
                            description: sit.summary || '（詳細内容未登録）',
                            process: sit.usageTiming || '',
                            recurring: ''
                          };
                          const copyKey = `${sit.id}-${roll}`;
                          const isCopied = copiedKey === copyKey;
                          const isDimmed = selectedRollFilter !== 'all' && selectedRollFilter !== roll;

                          return (
                            <td
                              key={roll}
                              className={`py-2.5 px-3 border-r border-stone-200 align-top transition-opacity ${
                                isDimmed ? 'opacity-30 bg-stone-100/50' : ''
                              }`}
                            >
                              <div className="space-y-1.5 h-full flex flex-col justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-1 pb-1 border-b border-stone-100">
                                    <span className="font-bold text-stone-900 text-xs font-serif leading-tight">
                                      {ev.title}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyEvent(sit.name, ev, copyKey, e)}
                                      className="p-1 text-stone-400 hover:text-amber-800 hover:bg-stone-100 rounded transition-colors cursor-pointer shrink-0"
                                      title="この出目の内容をコピー"
                                    >
                                      {isCopied ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>

                                  <div className="text-[11px] text-stone-850 leading-relaxed whitespace-pre-line select-text">
                                    {ev.description}
                                  </div>
                                </div>

                                <div className="pt-1.5 space-y-1">
                                  {ev.process && (
                                    <div className="bg-amber-50/90 p-1.5 rounded border border-amber-200/90 text-[10px] text-amber-950 leading-snug select-text">
                                      <span className="font-bold block text-amber-900 mb-0.5">【判定・処理】</span>
                                      {ev.process}
                                    </div>
                                  )}

                                  {ev.recurring && (
                                    <div className="text-[10px] text-stone-500 leading-snug select-text">
                                      <span className="font-bold text-stone-600">【再発生】</span>
                                      {ev.recurring}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORDS VIEW */}
      {displayMode === 'records' && (
        <div className="bg-white rounded-xl shadow-xs border border-stone-300 overflow-hidden">
          <div className="overflow-x-auto max-h-[75vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-850 text-stone-200 sticky top-0 z-20 shadow-2xs text-[11px] font-serif">
                <tr>
                  <th className="py-2.5 px-3 w-14 text-center">出目</th>
                  <th className="py-2.5 px-3 min-w-[140px] max-w-[180px]">シチュエーション名</th>
                  <th className="py-2.5 px-3 min-w-[160px] max-w-[200px]">題名</th>
                  <th className="py-2.5 px-4 min-w-[320px]">情景描写・内容</th>
                  <th className="py-2.5 px-3 min-w-[200px]">判定・処理</th>
                  <th className="py-2.5 px-3 min-w-[140px]">再発生時の処理</th>
                  <th className="py-2.5 px-3 w-20 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {contentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-500 font-serif text-sm">
                      条件に一致するレコードがありません。
                    </td>
                  </tr>
                ) : (
                  contentRecords.map(({ situation: sit, event: ev, key }, idx) => {
                    const isCopied = copiedKey === key;
                    const isSelected = selectedSituationId === sit.id;

                    return (
                      <tr
                        key={key}
                        className={`transition-colors hover:bg-amber-50/60 ${
                          isSelected ? 'bg-amber-100/50' : idx % 2 === 1 ? 'bg-stone-50/40' : 'bg-white'
                        }`}
                      >
                        {/* Roll */}
                        <td className="py-2.5 px-3 text-center align-top">
                          <span className={`inline-flex w-6 h-6 rounded items-center justify-center font-bold text-xs border shadow-2xs ${getRollBadgeColor(ev.roll)}`}>
                            {ev.roll}
                          </span>
                        </td>

                        {/* Situation Name & Badges */}
                        <td className="py-2.5 px-3 align-top font-serif">
                          <button
                            type="button"
                            onClick={() => onSelect(sit)}
                            className="font-bold text-stone-900 hover:text-amber-800 text-left cursor-pointer block leading-tight text-xs"
                          >
                            {sit.name}
                          </button>
                          <div className="flex items-center gap-1 mt-1 flex-wrap text-[10px]">
                            <span className="text-stone-500">{sit.category}</span>
                            <span className="text-stone-300">•</span>
                            <span className="text-stone-500">{sit.actorType}</span>
                          </div>
                        </td>

                        {/* Title */}
                        <td className="py-2.5 px-3 align-top font-serif font-bold text-stone-900">
                          {ev.title}
                        </td>

                        {/* Description */}
                        <td className="py-2.5 px-4 align-top text-stone-850 leading-relaxed select-text whitespace-pre-line text-xs">
                          {ev.description}
                        </td>

                        {/* Process */}
                        <td className="py-2.5 px-3 align-top select-text">
                          {ev.process ? (
                            <div className="bg-amber-50/80 p-1.5 rounded border border-amber-200 text-amber-950 text-[11px] leading-snug">
                              {ev.process}
                            </div>
                          ) : (
                            <span className="text-stone-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Recurring */}
                        <td className="py-2.5 px-3 align-top text-stone-600 text-[11px] select-text">
                          {ev.recurring || '-'}
                        </td>

                        {/* Action buttons */}
                        <td className="py-2.5 px-3 align-top text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleCopyEvent(sit.name, ev, key, e)}
                              className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs flex items-center gap-1 cursor-pointer transition-colors border border-stone-300"
                              title="クリップボードにコピー"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-[10px] text-emerald-700 font-bold">済</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span className="text-[10px]">コピー</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
