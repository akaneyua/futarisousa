import React, { useState } from 'react';
import { SituationInvestigation } from '../types.ts';
import { Book, Bookmark, Sparkles, ChevronRight, User, Users, ShieldAlert, Copy, Check, Star, Clock } from 'lucide-react';

interface SituationCardProps {
  situation: SituationInvestigation;
  isSelected: boolean;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onTagClick: (tag: string, e: React.MouseEvent) => void;
}

export const SituationCard: React.FC<SituationCardProps> = ({
  situation,
  isSelected,
  isFavorite,
  onClick,
  onToggleFavorite,
  onTagClick,
}) => {
  const isCommon = situation.category === '共通';
  const [copiedAbbr, setCopiedAbbr] = useState(false);

  const handleCopyAbbr = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!situation.abbreviation) return;
    navigator.clipboard.writeText(situation.abbreviation);
    setCopiedAbbr(true);
    setTimeout(() => setCopiedAbbr(false), 2000);
  };

  // Book accent colors
  const getBookBadgeStyle = (book?: string) => {
    const b = book || '';
    if (b.includes('大判')) return 'bg-amber-950/15 text-amber-950 border-amber-900/30';
    if (b.includes('基本')) return 'bg-amber-900/10 text-amber-900 border-amber-800/20';
    if (b.includes('怪盗')) return 'bg-purple-900/10 text-purple-900 border-purple-800/20';
    if (b.includes('仲良くなる')) return 'bg-rose-900/10 text-rose-900 border-rose-800/20';
    if (b.includes('ケイジ')) return 'bg-blue-900/10 text-blue-900 border-blue-800/20';
    if (b.includes('フェスティバル')) return 'bg-emerald-900/10 text-emerald-900 border-emerald-800/20';
    if (b.includes('手が離れても')) return 'bg-indigo-900/10 text-indigo-900 border-indigo-800/20';
    if (b.includes('友達')) return 'bg-teal-900/10 text-teal-900 border-teal-800/20';
    return 'bg-stone-800/10 text-stone-800 border-stone-800/20';
  };

  const getVersatilityBadge = (v?: string) => {
    switch (v) {
      case 'あり':
      case '高':
        return {
          label: '汎用性: あり',
          className: 'bg-emerald-50 text-emerald-900 border-emerald-300'
        };
      case '条件付きあり':
      case '中':
        return {
          label: '汎用性: 条件付きあり',
          className: 'bg-sky-50 text-sky-900 border-sky-300'
        };
      case '条件付きなし':
      case '特殊':
        return {
          label: '汎用性: 条件付きなし',
          className: 'bg-amber-50 text-amber-900 border-amber-300'
        };
      case 'なし':
      case '低':
        return {
          label: '汎用性: なし',
          className: 'bg-rose-50 text-rose-900 border-rose-300'
        };
      default:
        return null;
    }
  };

  const versatilityInfo = getVersatilityBadge(situation.versatility);

  const getActorIcon = (actor?: string) => {
    if (actor === '探偵だけ') return <User className="w-3.5 h-3.5 mr-1 text-sky-800" />;
    if (actor === '助手だけ') return <User className="w-3.5 h-3.5 mr-1 text-emerald-800" />;
    if (actor === 'NPCが登場する') return <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-800" />;
    return <Users className="w-3.5 h-3.5 mr-1 text-stone-700" />;
  };

  return (
    <div
      id={`card-${situation.id}`}
      onClick={onClick}
      className={`group relative text-left w-full cursor-pointer transition-all duration-150 rounded-lg p-4 border flex flex-col justify-between select-none ${
        isSelected
          ? 'bg-amber-50/80 border-amber-800 ring-2 ring-amber-700/20 shadow-sm'
          : 'bg-white hover:bg-stone-50/80 border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-stone-300'
      }`}
    >
      <div>
        {/* Top Header Row: Category, Book, Versatility Badge, Actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center flex-wrap gap-1.5">
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium tracking-wide border ${
                isCommon
                  ? 'bg-stone-900 text-amber-100 border-stone-800'
                  : 'bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              {situation.category}
            </span>

            {/* Versatility Quick Badge */}
            {versatilityInfo && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-bold font-serif border flex items-center ${versatilityInfo.className}`}
                title={situation.versatilityDescription || versatilityInfo.label}
              >
                <span>{versatilityInfo.label}</span>
              </span>
            )}

            <span className={`text-xs px-2 py-0.5 rounded font-medium border flex items-center ${getBookBadgeStyle(situation.sourceBook)}`}>
              <Book className="w-3 h-3 mr-1 inline-block opacity-70" />
              {situation.sourceBook} {situation.page && <span className="ml-1 opacity-80 font-mono text-[11px]">{situation.page}</span>}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              id={`fav-btn-${situation.id}`}
              onClick={onToggleFavorite}
              aria-label={isFavorite ? 'お気に入り解除' : 'お気に入りに追加'}
              className={`p-1 rounded transition-colors ${
                isFavorite
                  ? 'text-amber-600 hover:text-amber-700'
                  : 'text-stone-300 hover:text-stone-500'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <h3 className="text-lg font-bold text-stone-950 group-hover:text-amber-950 font-detective-title flex items-center flex-wrap gap-1.5">
            <span>{situation.name}</span>
            {situation.tableEvents && situation.tableEvents.length > 0 && (
              <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 bg-amber-100/90 text-amber-900 rounded font-sans font-normal border border-amber-300">
                <Sparkles className="w-2.5 h-2.5 mr-0.5 text-amber-700" />
                展開表あり
              </span>
            )}
          </h3>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-800 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        {/* 略称表示（コピー可能） */}
        {situation.abbreviation && (
          <div className="mb-2.5 flex items-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-serif font-bold bg-amber-100/80 text-amber-950 border border-amber-300/80">
              <span className="text-[10px] font-normal text-amber-800/80">略称:</span>
              <span>{situation.abbreviation}</span>
              <button
                type="button"
                onClick={handleCopyAbbr}
                className="ml-1 p-0.5 rounded hover:bg-amber-200/80 text-amber-800 transition-colors cursor-pointer flex items-center gap-0.5"
                title="略称をコピー"
              >
                {copiedAbbr ? (
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

        {/* 早見用の「概要」＆「使用タイミング」ボックス */}
        <div className="bg-stone-50/90 rounded-md p-2.5 border border-stone-200/80 mb-3 group-hover:bg-amber-50/50 group-hover:border-amber-200 transition-colors space-y-2">
          {/* 概要 */}
          <div>
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-900/10 text-amber-950 font-serif">
                概要
              </span>
              {situation.versatilityDescription && (
                <span className="text-[10px] text-stone-500 font-serif truncate max-w-[180px]" title={situation.versatilityDescription}>
                  目安: {situation.versatilityDescription}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-850 font-serif line-clamp-2 leading-relaxed">
              {situation.summary || '（概要未設定）'}
            </p>
          </div>

          {/* 使用タイミング */}
          {situation.usageTiming && (
            <div className="pt-1.5 border-t border-stone-200/70">
              <div className="flex items-center gap-1 mb-0.5 text-[10px] font-bold text-amber-900 font-serif">
                <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                <span>使用タイミング</span>
              </div>
              <p className="text-xs text-stone-900 font-serif line-clamp-2 leading-relaxed bg-amber-50/70 p-1.5 rounded border border-amber-200/70">
                {situation.usageTiming}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Meta & Tags */}
      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center text-stone-600 font-medium">
          {getActorIcon(situation.actorType)}
          <span>{situation.actorType}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {(situation.tags || []).slice(0, 3).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => onTagClick(tag, e)}
              className="text-[11px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900 transition-colors"
            >
              #{tag}
            </button>
          ))}
          {(situation.tags || []).length > 3 && (
            <span className="text-[10px] text-stone-400 px-1 self-center">
              +{(situation.tags || []).length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
