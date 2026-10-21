import React, { useState, useEffect } from 'react';
import { Copy, Check, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface FormattedNoteContentProps {
  content: string;
  className?: string;
  onImageClick?: (src: string, alt: string) => void;
}

export interface LightboxImage {
  src: string;
  alt?: string;
  images?: string[];
  currentIndex?: number;
}

/**
 * Reusable Image Lightbox Modal for zooming in on images (supports multiple images)
 */
export const ImageLightboxModal: React.FC<{
  image: LightboxImage | null;
  onClose: () => void;
}> = ({ image, onClose }) => {
  const [idx, setIdx] = useState<number>(0);

  useEffect(() => {
    if (image) {
      setIdx(image.currentIndex ?? 0);
    }
  }, [image]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!image) return;
      if (e.key === 'Escape') onClose();
      if (image.images && image.images.length > 1) {
        if (e.key === 'ArrowLeft') {
          setIdx((prev) => (prev > 0 ? prev - 1 : image.images!.length - 1));
        } else if (e.key === 'ArrowRight') {
          setIdx((prev) => (prev < image.images!.length - 1 ? prev + 1 : 0));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  const imagesList = image.images && image.images.length > 0 ? image.images : [image.src];
  const currentSrc = imagesList[idx] || image.src;
  const hasMultiple = imagesList.length > 1;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIdx((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIdx((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-sm animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[92vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 p-1.5 rounded-full bg-stone-800 text-stone-200 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer shadow-lg"
          title="閉じる (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-200 hover:text-white transition-colors cursor-pointer shadow-lg border border-stone-700 z-10"
              title="前の画像 (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-200 hover:text-white transition-colors cursor-pointer shadow-lg border border-stone-700 z-10"
              title="次の画像 (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <img
          src={currentSrc}
          alt={image.alt || '画像'}
          className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-stone-700 bg-stone-900"
        />

        <div className="flex items-center gap-2 mt-2">
          {image.alt && (
            <p className="text-xs text-stone-300 font-sans bg-stone-900/90 px-3 py-1 rounded-full border border-stone-800">
              {image.alt}
            </p>
          )}
          {hasMultiple && (
            <span className="text-xs text-amber-300 font-mono bg-stone-900/90 px-2.5 py-1 rounded-full border border-stone-800">
              {idx + 1} / {imagesList.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Render inline markdown-style bold text (**bold**, __bold__, <b>bold</b>, <strong>bold</strong>)
 */
export const renderInlineBold = (text: string): React.ReactNode => {
  if (!text) return null;

  // Match bold patterns: **...**, __...__, <b>...</b>, <strong>...</strong>
  const regex = /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|<b>[\s\S]+?<\/b>|<strong>[\s\S]+?<\/strong>)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={index}
          className="font-bold text-stone-950 font-serif bg-amber-200/60 px-1 py-0.2 rounded shadow-2xs"
        >
          {inner}
        </strong>
      );
    }
    if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={index}
          className="font-bold text-stone-950 font-serif bg-amber-200/60 px-1 py-0.2 rounded shadow-2xs"
        >
          {inner}
        </strong>
      );
    }
    if (part.startsWith('<b>') && part.endsWith('</b>') && part.length >= 7) {
      const inner = part.slice(3, -4);
      return (
        <strong
          key={index}
          className="font-bold text-stone-950 font-serif bg-amber-200/60 px-1 py-0.2 rounded shadow-2xs"
        >
          {inner}
        </strong>
      );
    }
    if (part.startsWith('<strong>') && part.endsWith('</strong>') && part.length >= 17) {
      const inner = part.slice(8, -9);
      return (
        <strong
          key={index}
          className="font-bold text-stone-950 font-serif bg-amber-200/60 px-1 py-0.2 rounded shadow-2xs"
        >
          {inner}
        </strong>
      );
    }
    return part;
  });
};

export const FormattedNoteContent: React.FC<FormattedNoteContentProps> = ({
  content,
  className = '',
  onImageClick
}) => {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [internalZoomImage, setInternalZoomImage] = useState<LightboxImage | null>(null);

  if (!content) return null;

  const handleImageClick = (src: string, alt: string) => {
    if (onImageClick) {
      onImageClick(src, alt);
    } else {
      setInternalZoomImage({ src, alt });
    }
  };

  const handleCopyCode = (codeText: string, idx: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(codeText.trim());
      setCopiedCodeIdx(idx);
      setTimeout(() => setCopiedCodeIdx(null), 1800);
    }
  };

  // 1. Check if content includes code blocks ```
  if (content.includes('```')) {
    const parts = content.split('```');
    return (
      <div className={`space-y-2.5 ${className}`}>
        {parts.map((part, idx) => {
          if (idx % 2 === 1) {
            // Code block content
            const cleanCode = part.replace(/^[a-z]+\n/, '').trim();
            const isCopied = copiedCodeIdx === idx;
            return (
              <div key={idx} className="relative group my-2">
                <pre className="p-3.5 bg-stone-900 text-amber-200 rounded-lg text-xs font-mono overflow-x-auto border border-stone-800 leading-relaxed shadow-inner">
                  {cleanCode}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopyCode(cleanCode, idx)}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[10px] font-sans flex items-center gap-1 border border-stone-700 shadow-2xs cursor-pointer transition-colors"
                  title="コードをクリップボードにコピー"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">コピー完了</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-amber-400" />
                      <span>コピー</span>
                    </>
                  )}
                </button>
              </div>
            );
          }

          // Outside code block
          return (
            <FormattedNoteContent
              key={idx}
              content={part.trim()}
              onImageClick={handleImageClick}
            />
          );
        })}
        <ImageLightboxModal
          image={internalZoomImage}
          onClose={() => setInternalZoomImage(null)}
        />
      </div>
    );
  }

  // 2. Check if content includes a markdown table (| ... |)
  if (content.includes('|') && content.includes('\n|')) {
    const lines = content.split('\n');
    const tableLines = lines.filter((l) => l.trim().startsWith('|'));
    const nonTableLinesBefore: string[] = [];
    const nonTableLinesAfter: string[] = [];
    let seenTable = false;

    lines.forEach((line) => {
      if (line.trim().startsWith('|')) {
        seenTable = true;
      } else if (!seenTable) {
        nonTableLinesBefore.push(line);
      } else {
        nonTableLinesAfter.push(line);
      }
    });

    if (tableLines.length >= 2) {
      return (
        <div className={`space-y-2.5 ${className}`}>
          {nonTableLinesBefore.length > 0 && (
            <FormattedLines lines={nonTableLinesBefore} onImageClick={handleImageClick} />
          )}

          <div className="overflow-x-auto my-2 border border-stone-300 rounded-lg bg-white shadow-2xs">
            <table className="w-full text-xs text-left border-collapse font-serif">
              <tbody>
                {tableLines.map((row, rIdx) => {
                  if (row.includes('---')) return null; // Separator row
                  const cells = row
                    .split('|')
                    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
                    .map((c) => c.trim());
                  const isHeader = rIdx === 0;

                  return (
                    <tr
                      key={rIdx}
                      className={
                        isHeader
                          ? 'bg-amber-50/90 font-bold border-b border-stone-300 text-stone-900'
                          : 'border-b border-stone-200/80 hover:bg-amber-50/40 text-stone-850'
                      }
                    >
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                          {renderInlineBold(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {nonTableLinesAfter.length > 0 && (
            <FormattedLines lines={nonTableLinesAfter} onImageClick={handleImageClick} />
          )}

          <ImageLightboxModal
            image={internalZoomImage}
            onClose={() => setInternalZoomImage(null)}
          />
        </div>
      );
    }
  }

  // 3. Regular multiline text with bold formatting and headers
  const lines = content.split('\n');
  return (
    <>
      <FormattedLines lines={lines} className={className} onImageClick={handleImageClick} />
      <ImageLightboxModal
        image={internalZoomImage}
        onClose={() => setInternalZoomImage(null)}
      />
    </>
  );
};

/**
 * Helper to render individual lines with bold, headings, and hierarchy (大分類・中分類)
 */
const FormattedLines: React.FC<{
  lines: string[];
  className?: string;
  onImageClick?: (src: string, alt: string) => void;
}> = ({ lines, className = '', onImageClick }) => {
  return (
    <div className={`space-y-2 leading-relaxed font-serif ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // 0. Markdown image: ![alt](url)
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          const altText = imgMatch[1];
          const imgSrc = imgMatch[2];
          return (
            <div key={idx} className="my-3 rounded-lg overflow-hidden border border-stone-200/90 bg-stone-900/5 shadow-xs max-w-full group">
              <button
                type="button"
                onClick={() => onImageClick?.(imgSrc, altText || '添付画像')}
                className="w-full text-left relative cursor-zoom-in block"
                title="クリックして拡大表示"
              >
                <img
                  src={imgSrc}
                  alt={altText || '添付画像'}
                  className="max-h-80 w-auto mx-auto object-contain block group-hover:scale-[1.01] transition-transform"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-stone-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs shadow-md flex items-center gap-1 text-[11px] font-sans">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>拡大</span>
                </div>
              </button>
              {altText && (
                <div className="text-[11px] text-stone-600 text-center py-1 px-2 bg-stone-100/70 border-t border-stone-200/70 font-sans">
                  {altText}
                </div>
              )}
            </div>
          );
        }

        // 1. 大見出し (Heading 1)
        // Matches: # Title, 【大分類】Title, [大分類] Title, 大分類: Title, 大分類：Title
        const isExplicitMajor =
          trimmed.startsWith('# ') ||
          trimmed.startsWith('【大分類】') ||
          trimmed.startsWith('【大分類: ') ||
          trimmed.startsWith('【大分類：') ||
          trimmed.startsWith('[大分類]') ||
          trimmed.startsWith('大分類:') ||
          trimmed.startsWith('大分類：');

        if (isExplicitMajor) {
          let majorTitle = trimmed;
          if (majorTitle.startsWith('# ')) majorTitle = majorTitle.substring(2).trim();
          if (majorTitle.startsWith('【大分類】')) majorTitle = majorTitle.substring(5).trim();
          else if (majorTitle.startsWith('[大分類]')) majorTitle = majorTitle.substring(5).trim();
          else if (majorTitle.startsWith('大分類:')) majorTitle = majorTitle.substring(4).trim();
          else if (majorTitle.startsWith('大分類：')) majorTitle = majorTitle.substring(4).trim();
          else if (majorTitle.startsWith('【大分類:')) majorTitle = majorTitle.replace(/^【大分類:\s*/, '').replace(/】$/, '').trim();
          else if (majorTitle.startsWith('【大分類：')) majorTitle = majorTitle.replace(/^【大分類：\s*/, '').replace(/】$/, '').trim();

          majorTitle = majorTitle.replace(/【大分類】/g, '').replace(/\[大分類\]/g, '').replace(/大分類[：:]/g, '').trim();

          return (
            <div key={idx} className="mt-4 mb-2 pt-2 border-t-2 border-amber-900/20 first:mt-0 first:pt-0">
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-100/90 via-amber-50 to-stone-50 px-3 py-2 rounded-lg border-l-4 border-amber-800 text-stone-900 font-bold font-detective-title text-sm sm:text-base shadow-2xs">
                <span className="w-2 h-4 bg-amber-800 rounded-xs shrink-0" />
                <span className="leading-snug">{renderInlineBold(majorTitle)}</span>
              </div>
            </div>
          );
        }

        // 2. 中見出し (Heading 2)
        // Matches: ## Title, 【中分類】Title, [中分類] Title, 中分類: Title, 中分類：Title
        const isExplicitMid =
          trimmed.startsWith('## ') ||
          trimmed.startsWith('【中分類】') ||
          trimmed.startsWith('【中分類: ') ||
          trimmed.startsWith('【中分類：') ||
          trimmed.startsWith('[中分類]') ||
          trimmed.startsWith('中分類:') ||
          trimmed.startsWith('中分類：');

        if (isExplicitMid) {
          let midTitle = trimmed;
          if (midTitle.startsWith('## ')) midTitle = midTitle.substring(3).trim();
          if (midTitle.startsWith('【中分類】')) midTitle = midTitle.substring(5).trim();
          else if (midTitle.startsWith('[中分類]')) midTitle = midTitle.substring(5).trim();
          else if (midTitle.startsWith('中分類:')) midTitle = midTitle.substring(4).trim();
          else if (midTitle.startsWith('中分類：')) midTitle = midTitle.substring(4).trim();
          else if (midTitle.startsWith('【中分類:')) midTitle = midTitle.replace(/^【中分類:\s*/, '').replace(/】$/, '').trim();
          else if (midTitle.startsWith('【中分類：')) midTitle = midTitle.replace(/^【中分類：\s*/, '').replace(/】$/, '').trim();

          midTitle = midTitle.replace(/【中分類】/g, '').replace(/\[中分類\]/g, '').replace(/中分類[：:]/g, '').trim();

          return (
            <div key={idx} className="mt-3.5 mb-1.5 pl-0.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-900 font-detective-title border-b-2 border-amber-800/30 pb-1.5 bg-amber-50/60 px-2.5 py-1.5 rounded-t-lg">
                <span className="text-amber-800 text-xs">◆</span>
                <span className="leading-snug">{renderInlineBold(midTitle)}</span>
              </div>
            </div>
          );
        }

        // Standard Heading 3: ### Title
        if (trimmed.startsWith('### ')) {
          let h3Text = trimmed.substring(4);
          h3Text = h3Text.replace(/【小分類】/g, '').replace(/\[小分類\]/g, '').replace(/小分類[：:]/g, '').trim();
          return (
            <h4
              key={idx}
              className="text-xs sm:text-sm font-bold text-amber-950 border-b border-amber-900/30 pb-0.5 pt-1 mt-2 mb-1 flex items-center gap-1.5 font-detective-title"
            >
              <span className="w-1.5 h-3 bg-amber-700 rounded-xs" />
              <span>{renderInlineBold(h3Text)}</span>
            </h4>
          );
        }

        // Heading 4: #### Title
        if (trimmed.startsWith('#### ')) {
          return (
            <h5
              key={idx}
              className="text-xs font-bold text-stone-800 pt-1 mt-1 mb-0.5 flex items-center gap-1.5 font-detective-title"
            >
              <span className="text-amber-800">■</span>
              <span>{renderInlineBold(trimmed.substring(5))}</span>
            </h5>
          );
        }

        // Bullet point: ・ or - or *
        if (trimmed.startsWith('・') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const contentWithoutBullet = trimmed.startsWith('・')
            ? trimmed.substring(1)
            : trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1.5 text-stone-850">
              <span className="text-amber-700 font-bold shrink-0 mt-0.5">•</span>
              <div className="flex-1 min-w-0">
                {renderInlineBold(contentWithoutBullet)}
              </div>
            </div>
          );
        }

        // Numbered list: 1. 2. etc.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const text = numMatch[2];
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 text-stone-850">
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded px-1 shrink-0 mt-0.5">
                {num}
              </span>
              <div className="flex-1 min-w-0">
                {renderInlineBold(text)}
              </div>
            </div>
          );
        }

        // Circled numbers: ① ② ③ etc.
        const circledMatch = trimmed.match(/^([①②③④⑤⑥⑦⑧⑨⑩])\s*(.*)$/);
        if (circledMatch) {
          const circ = circledMatch[1];
          const text = circledMatch[2];
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 pt-0.5 text-stone-850">
              <span className="font-serif text-xs font-bold text-amber-900 bg-amber-100/80 border border-amber-300/80 rounded px-1 shrink-0 mt-0.5">
                {circ}
              </span>
              <div className="flex-1 min-w-0 font-bold text-stone-900">
                {renderInlineBold(text)}
              </div>
            </div>
          );
        }

        // Normal text line with bold parsing
        return (
          <p key={idx} className="text-stone-850">
            {renderInlineBold(line)}
          </p>
        );
      })}
    </div>
  );
};
