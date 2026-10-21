import React from 'react';
import { HelpCircle } from 'lucide-react';

interface SecretAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SecretAvatar: React.FC<SecretAvatarProps> = ({ size = 'md', className = '' }) => {
  if (size === 'xs' || size === 'sm') {
    // 20px - 24px (Tab bar, mini avatars)
    return (
      <div
        className={`w-full h-full bg-linear-to-b from-stone-900 via-stone-950 to-black text-amber-400/90 flex items-center justify-center font-mono font-black select-none border border-red-900/50 shadow-inner ${className}`}
        title="シークレット（未確認・画像なし）"
      >
        <span className="text-[10px] font-black tracking-tighter text-red-400">?</span>
      </div>
    );
  }

  if (size === 'md') {
    // 32px - 40px (Table row avatar)
    return (
      <div
        className={`w-full h-full bg-linear-to-b from-stone-900 via-stone-950 to-black relative flex flex-col items-center justify-center overflow-hidden border border-red-900/60 select-none shadow-inner ${className}`}
        title="シークレット（未確認・画像なし）"
      >
        {/* Silhouette shadow */}
        <div className="w-5 h-5 rounded-full bg-stone-800/80 absolute top-1" />
        <div className="w-8 h-4 rounded-t-full bg-stone-850 absolute -bottom-0.5" />
        {/* SECRET stamp */}
        <div className="z-10 transform -rotate-12 bg-red-950/90 border border-red-500/80 px-1 rounded-xs shadow-xs">
          <span className="text-[7.5px] font-mono font-black text-red-300 tracking-wider">SECRET</span>
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    // 56px (Card avatar)
    return (
      <div
        className={`w-full h-full bg-linear-to-b from-stone-900 via-stone-950 to-black relative flex flex-col items-center justify-center overflow-hidden border border-red-900/70 select-none shadow-inner ${className}`}
        title="シークレット（極秘・画像未登録）"
      >
        {/* Mysterious silhouette */}
        <div className="w-7 h-7 rounded-full bg-stone-800/80 absolute top-2 border border-stone-700/50" />
        <div className="w-12 h-6 rounded-t-full bg-stone-850 absolute -bottom-0.5 border-t border-stone-700/40" />
        
        {/* Stamp banner */}
        <div className="z-10 transform -rotate-12 bg-red-950/95 border border-red-500 text-red-300 font-mono font-black text-[9px] tracking-widest px-1.5 py-0.5 shadow-md">
          SECRET
        </div>
        <div className="absolute bottom-1 text-[8px] font-serif font-bold text-stone-500 tracking-wider z-10">
          ？？？
        </div>
      </div>
    );
  }

  // 'xl' (80px - 144px: Dossier Header & Edit Modal Preview)
  return (
    <div
      className={`w-full h-full bg-linear-to-b from-stone-900 via-stone-950 to-black relative flex flex-col items-center justify-center overflow-hidden border-2 border-red-900/80 select-none shadow-inner ${className}`}
      title="シークレット（極秘・画像未登録）"
    >
      {/* Background noir spotlight effect */}
      <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-black/80 pointer-events-none" />

      {/* Shadow figure silhouette */}
      <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-stone-800/90 absolute top-3 sm:top-4 border border-stone-700/60 shadow-lg flex items-center justify-center">
        <HelpCircle className="w-6 h-6 text-stone-600/70" />
      </div>
      <div className="w-20 sm:w-24 h-9 sm:h-11 rounded-t-full bg-stone-850 absolute -bottom-0.5 border-t border-stone-700/50" />

      {/* Red confidential stamp */}
      <div className="z-10 transform -rotate-14 bg-red-950/95 border-2 border-red-500 text-red-300 font-mono font-black text-[11px] sm:text-xs tracking-widest px-2.5 py-0.5 shadow-xl rounded-xs ring-1 ring-red-900/50">
        SECRET
      </div>

      <div className="absolute bottom-1.5 sm:bottom-2 text-[10px] font-serif font-bold text-stone-400 tracking-widest z-10 drop-shadow-sm">
        ？？？ / 未確認
      </div>
    </div>
  );
};
