import React from 'react';
import { CharacterClass, CharacterRole } from '../types.ts';
import { Book, ShieldCheck, GraduationCap, Dices, ChevronRight } from 'lucide-react';

interface ClassCardProps {
  characterClass: CharacterClass;
  isSelected?: boolean;
  onClick: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  characterClass: c,
  isSelected = false,
  onClick,
}) => {

  const getRoleBadgeStyle = (role: CharacterRole) => {
    switch (role) {
      case '探偵':
        return 'bg-amber-900 text-amber-100 border-amber-700';
      case '助手':
        return 'bg-teal-900 text-teal-100 border-teal-700';
      case '刑事':
        return 'bg-indigo-900 text-indigo-100 border-indigo-700';
      default:
        return 'bg-stone-800 text-stone-100 border-stone-600';
    }
  };

  const getRoleAccentBorder = (role: CharacterRole) => {
    switch (role) {
      case '探偵':
        return 'hover:border-amber-600';
      case '助手':
        return 'hover:border-teal-600';
      case '刑事':
        return 'hover:border-indigo-600';
      default:
        return 'hover:border-stone-400';
    }
  };

  return (
    <div
      id={`class-card-${c.id}`}
      onClick={onClick}
      className={`group relative text-left w-full cursor-pointer transition-all duration-150 rounded-xl p-4 sm:p-5 border bg-white shadow-2xs flex flex-col justify-between select-none ${
        isSelected
          ? 'ring-2 ring-amber-700/30 border-amber-800 bg-amber-50/40 shadow-sm'
          : `border-stone-200/90 hover:shadow-md hover:bg-stone-50/60 ${getRoleAccentBorder(c.role || '探偵')}`
      }`}
    >
      <div>
        {/* Top Header Row: Role, Alias, SourceBook */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center flex-wrap gap-1.5">
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-bold font-serif shadow-2xs border ${getRoleBadgeStyle(
                c.role || '探偵'
              )}`}
            >
              {c.role || '探偵'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-medium border bg-stone-100 text-stone-700 border-stone-200 flex items-center">
              <Book className="w-3 h-3 mr-1 text-stone-500 inline-block" />
              {c.sourceBook || '基本ルールブック'}
            </span>
          </div>
        </div>

        {/* Class Name & Alias */}
        <div className="mb-2">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-lg font-bold font-detective-title text-stone-950 group-hover:text-amber-900 transition-colors">
              {c.name || '名称未設定'}
            </h3>
            {c.alias && (
              <span className="text-xs text-stone-400 font-mono shrink-0">
                {c.alias}
              </span>
            )}
          </div>
        </div>

        {/* Description preview if available */}
        {c.description && (
          <p className="text-xs font-serif text-stone-700 leading-relaxed mb-3 line-clamp-2 bg-stone-50 p-2 rounded border border-stone-200/70 group-hover:bg-amber-50/40 group-hover:border-amber-200/60 transition-colors">
            {c.description}
          </p>
        )}

        {/* 修得技能 (Skills Acquired) preview if available */}
        {c.skillsAcquired && (
          <div className="flex items-start gap-1.5 text-[11px] text-stone-600 font-serif mb-2 line-clamp-1">
            <GraduationCap className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
            <span className="truncate">
              <span className="font-bold text-stone-800">修得技能: </span>
              {c.skillsAcquired}
            </span>
          </div>
        )}
      </div>

      {/* Card Footer: Metadata tags & Click prompt */}
      <div className="pt-2.5 mt-2 border-t border-stone-200/60 flex items-center justify-between text-xs font-serif text-stone-500">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
            <ShieldCheck className="w-3 h-3 text-teal-700" />
            <span>自動取得アクション</span>
          </span>

          {c.backgroundTable && c.backgroundTable.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
              <Dices className="w-3 h-3 text-stone-600" />
              <span>
                {c.backgroundTable.length === 6 || c.role === '助手' ? '1D6背景表' : '1D10背景表'}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center text-amber-800 font-bold text-xs group-hover:translate-x-0.5 transition-transform">
          <span>調書を開く</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </div>
      </div>
    </div>
  );
};
