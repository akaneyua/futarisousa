import React from 'react';
import { SituationInvestigation } from '../types.ts';
import { Book, Bookmark, Sparkles, Copy, Check, User, Users, ShieldAlert, ChevronRight, Star, Clock } from 'lucide-react';

interface SituationQuickTableViewProps {
  situations: SituationInvestigation[];
  selectedSituationId?: string;
  favorites: string[];
  onSelect: (situation: SituationInvestigation) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const SituationQuickTableView: React.FC<SituationQuickTableViewProps> = ({
  situations,
  selectedSituationId,
  favorites,
  onSelect,
  onToggleFavorite,
}) => {
  const [copiedAbbrId, setCopiedAbbrId] = React.useState<string | null>(null);
  const [expandedRowIds, setExpandedRowIds] = React.useState<Record<string, boolean>>({});

  const toggleRowContent = (id: string) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyAbbr = (id: string, abbr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(abbr);
    setCopiedAbbrId(id);
    setTimeout(() => setCopiedAbbrId((prev) => (prev === id ? null : prev)), 2000);
  };

  const getVersatilityBadge = (v?: string) => {
    switch (v) {
      case 'あり':
      case '高':
        return {
          label: 'あり',
          className: 'bg-emerald-50 text-emerald-900 border-emerald-300'
        };
      case '条件付きあり':
      case '中':
        return {
          label: '条件付きあり',
          className: 'bg-sky-50 text-sky-900 border-sky-300'
        };
      case '条件付きなし':
      case '特殊':
        return {
          label: '条件付きなし',
          className: 'bg-amber-50 text-amber-900 border-amber-300'
        };
      case 'なし':
      case '低':
        return {
          label: 'なし',
          className: 'bg-rose-50 text-rose-900 border-rose-300'
        };
      default:
        return {
          label: '条件付きあり',
          className: 'bg-stone-50 text-stone-800 border-stone-300'
        };
    }
  };

  const getActorIcon = (actor: string) => {
    if (actor === '探偵だけ') return <User className="w-3.5 h-3.5 text-sky-700 inline mr-1" />;
    if (actor === '助手だけ') return <User className="w-3.5 h-3.5 text-emerald-700 inline mr-1" />;
    if (actor === 'NPCが登場する') return <ShieldAlert className="w-3.5 h-3.5 text-amber-700 inline mr-1" />;
    return <Users className="w-3.5 h-3.5 text-stone-700 inline mr-1" />;
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-xs border border-stone-300 overflow-hidden font-serif select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-900 text-stone-200 border-b border-stone-800 text-[11px] select-none tracking-wider">
              <th className="py-3 px-3 w-10 text-center">
                <Bookmark className="w-3.5 h-3.5 mx-auto opacity-70" />
              </th>
              <th className="py-3 px-3 font-semibold min-w-[150px]">シチュエーション名</th>
              <th className="py-3 px-3 font-semibold w-24">分類</th>
              <th className="py-3 px-3 font-semibold min-w-[140px]">汎用性</th>
              <th className="py-3 px-3 font-semibold min-w-[240px]">概要</th>
              <th className="py-3 px-3 font-semibold min-w-[260px] text-amber-200">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>使用タイミング</span>
                </span>
              </th>
              <th className="py-3 px-3 font-semibold w-28">参加者</th>
              <th className="py-3 px-3 font-semibold min-w-[140px]">出典書籍</th>
              <th className="py-3 px-3 w-20 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {situations.map((s, idx) => {
              const isFav = favorites.includes(s.id);
              const isSelected = selectedSituationId === s.id;
              const vInfo = getVersatilityBadge(s.versatility);
              const isCommon = s.category === '共通';

              return (
                <React.Fragment key={s.id}>
                  <tr
                    onClick={() => onSelect(s)}
                  className={`cursor-pointer transition-colors duration-100 group ${
                    isSelected
                      ? 'bg-amber-100/80 hover:bg-amber-100 font-medium'
                      : idx % 2 === 0
                      ? 'bg-white hover:bg-amber-50/60'
                      : 'bg-stone-50/50 hover:bg-amber-50/60'
                  }`}
                >
                  {/* Favorite */}
                  <td className="py-2.5 px-3 text-center align-top" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => onToggleFavorite(s.id, e)}
                      className="p-1 rounded text-stone-300 hover:text-amber-600 transition-colors"
                      title={isFav ? 'お気に入り解除' : 'お気に入りに追加'}
                    >
                      <Bookmark className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-600' : ''}`} />
                    </button>
                  </td>

                  {/* Name */}
                  <td className="py-2.5 px-3 font-bold text-stone-950 font-detective-title text-sm align-top">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="group-hover:text-amber-950 transition-colors">{s.name}</span>
                      {s.tableEvents && s.tableEvents.length > 0 && (
                        <span className="text-[10px] px-1 py-0.2 bg-amber-100 text-amber-900 rounded font-normal font-sans border border-amber-300 inline-flex items-center">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5 text-amber-700" />
                          1D6
                        </span>
                      )}
                    </div>
                    {s.abbreviation && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-serif border bg-amber-100/80 text-amber-950 border-amber-300">
                          <span className="text-[10px] text-amber-800/80 font-normal">略称:</span>
                          <span className="font-bold">{s.abbreviation}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyAbbr(s.id, s.abbreviation!, e)}
                            className="ml-1 p-0.5 rounded hover:bg-amber-200/80 text-amber-800 transition-colors cursor-pointer flex items-center gap-0.5"
                            title="略称をコピー"
                          >
                            {copiedAbbrId === s.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-[10px] text-emerald-700">済</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-amber-700" />
                                <span className="text-[10px] text-amber-800">コピー</span>
                              </>
                            )}
                          </button>
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-2.5 px-3 align-top">
                    <span
                      className={`inline-block text-[11px] px-2 py-0.5 rounded font-medium border ${
                        isCommon
                          ? 'bg-stone-900 text-amber-100 border-stone-800'
                          : 'bg-stone-200/70 text-stone-800 border-stone-300'
                      }`}
                    >
                      {s.category}
                    </span>
                  </td>

                  {/* Versatility (汎用性) */}
                  <td className="py-2.5 px-3 align-top">
                    <div className="space-y-0.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${vInfo.className}`}
                      >
                        <span>{vInfo.label}</span>
                      </span>
                      {s.versatilityDescription && (
                        <div className="text-[11px] text-stone-600 leading-tight">
                          {s.versatilityDescription}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Summary (概要) */}
                  <td className="py-2.5 px-3 text-stone-850 leading-relaxed align-top">
                    <div className="text-xs font-serif leading-relaxed select-text">
                      {s.summary ? (
                        <span>{s.summary}</span>
                      ) : (
                        <span className="text-stone-400 italic text-[11px]">（概要未登録）</span>
                      )}
                    </div>
                  </td>

                  {/* Usage Timing (使用タイミング) */}
                  <td className="py-2.5 px-3 leading-relaxed align-top">
                    {s.usageTiming ? (
                      <div className="bg-amber-50/90 border border-amber-200/90 rounded-md p-2 text-stone-900 font-serif text-xs leading-relaxed select-text shadow-2xs">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-900 mb-0.5">
                          <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                          <span>どんな状況で使うか</span>
                        </div>
                        <div className="font-medium text-stone-900">
                          {s.usageTiming}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-stone-400 italic font-serif">（使用タイミング未設定）</span>
                    )}
                  </td>

                  {/* Actor */}
                  <td className="py-2.5 px-3 text-stone-700 whitespace-nowrap align-top">
                    <div className="flex items-center text-[11px]">
                      {getActorIcon(s.actorType)}
                      <span>{s.actorType}</span>
                    </div>
                  </td>

                  {/* Source Book */}
                  <td className="py-2.5 px-3 text-stone-600 text-[11px] align-top">
                    <div className="flex items-center flex-wrap gap-1">
                      <span>{s.sourceBook}</span>
                      {s.page && <span className="font-mono text-[10px] opacity-80 bg-stone-100 px-1 rounded border border-stone-200">{s.page}</span>}
                    </div>
                    {s.sourceBook2 && (
                      <div className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <span>{s.sourceBook2}</span>
                        {s.page2 && <span className="font-mono text-[9px] opacity-80">{s.page2}</span>}
                      </div>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap align-top" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleRowContent(s.id)}
                        className={`px-2 py-1 rounded border transition-colors flex items-center gap-0.5 text-xs font-serif cursor-pointer ${
                          expandedRowIds[s.id]
                            ? 'bg-amber-900 text-amber-100 border-amber-800'
                            : 'text-stone-600 hover:text-amber-950 hover:bg-amber-100 border-stone-200'
                        }`}
                        title={expandedRowIds[s.id] ? '内容表を閉じる' : '1D6内容表を展開する'}
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>内容{expandedRowIds[s.id] ? '▲' : '▼'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelect(s)}
                        title="調書を開く"
                        className="px-2 py-1 rounded text-stone-600 hover:text-amber-950 hover:bg-amber-100 border border-stone-200 transition-colors flex items-center gap-0.5 text-xs font-serif cursor-pointer"
                      >
                        <span>調書</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Inline 1D6 Content Expansion Sub-Row */}
                {expandedRowIds[s.id] && (
                  <tr key={`${s.id}-content-drawer`} className="bg-amber-50/50">
                    <td colSpan={9} className="p-3 sm:p-4 border-t border-b border-amber-200/80">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 border-b border-amber-200 pb-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                            <Sparkles className="w-4 h-4 text-amber-700" />
                            <span>【{s.name}】1D6シチュエーション内容表</span>
                          </div>
                          <span className="text-[11px] text-stone-500">
                            ※出目1〜6の題名・描写・処理・再発生
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                          {[1, 2, 3, 4, 5, 6].map((roll) => {
                            const ev = (s.tableEvents || []).find((e) => e.roll === roll) || {
                              roll,
                              title: `出目 ${roll}`,
                              description: s.summary || '（描写未設定）',
                              process: s.usageTiming || '',
                              recurring: ''
                            };

                            return (
                              <div
                                key={roll}
                                className="bg-white rounded-lg p-2.5 border border-stone-300 shadow-2xs space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded bg-amber-800 text-amber-100 font-bold text-[11px] flex items-center justify-center">
                                      {roll}
                                    </span>
                                    <span className="font-bold text-stone-900">{ev.title}</span>
                                  </div>
                                </div>

                                <div className="text-stone-850 leading-relaxed text-[11px] whitespace-pre-line select-text">
                                  {ev.description}
                                </div>

                                {ev.process && (
                                  <div className="bg-amber-50/80 p-1.5 rounded border border-amber-200/80 text-amber-950 text-[11px] leading-relaxed whitespace-pre-line select-text">
                                    <span className="font-bold block text-[10px] text-amber-900">判定・処理:</span>
                                    {ev.process}
                                  </div>
                                )}

                                {ev.recurring && (
                                  <div className="text-[10px] text-stone-600 leading-snug whitespace-pre-line select-text">
                                    <span className="font-bold text-stone-500">再発生: </span>
                                    {ev.recurring}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
};
