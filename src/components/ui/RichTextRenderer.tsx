import React from 'react';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into blocks by double newlines
  const blocks = content.split(/\n\n+/);

  const renderInline = (text: string): React.ReactNode[] => {
    // Regex matches <b>, <i>, <u>, <mark>, <verse>, **bold**, *italic*, ~~strike~~
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Verse block <verse>...</verse>
      const verseMatch = remaining.match(/^<verse>([\s\S]*?)<\/verse>/i);
      if (verseMatch) {
        tokens.push(
          <span
            key={key++}
            className="inline-block my-1.5 px-3 py-2 rounded-lg bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 border-l-4 border-[#5E72E4] font-serif-reading italic text-neutral-800 dark:text-neutral-100"
          >
            {renderInline(verseMatch[1])}
          </span>
        );
        remaining = remaining.slice(verseMatch[0].length);
        continue;
      }

      // Mark / Highlight: <mark>...</mark>
      const markMatch = remaining.match(/^<mark>([\s\S]*?)<\/mark>/i);
      if (markMatch) {
        tokens.push(
          <span
            key={key++}
            className="px-1.5 py-0.5 rounded bg-amber-400/25 dark:bg-amber-400/30 text-amber-900 dark:text-amber-200 font-semibold"
          >
            {renderInline(markMatch[1])}
          </span>
        );
        remaining = remaining.slice(markMatch[0].length);
        continue;
      }

      // Underline: <u>...</u>
      const uMatch = remaining.match(/^<u>([\s\S]*?)<\/u>/i);
      if (uMatch) {
        tokens.push(
          <span key={key++} className="underline decoration-[#5E72E4] underline-offset-2">
            {renderInline(uMatch[1])}
          </span>
        );
        remaining = remaining.slice(uMatch[0].length);
        continue;
      }

      // Bold: <b>...</b> or **...**
      const boldHtmlMatch = remaining.match(/^<b>([\s\S]*?)<\/b>/i);
      if (boldHtmlMatch) {
        tokens.push(
          <strong key={key++} className="font-bold text-neutral-900 dark:text-white">
            {renderInline(boldHtmlMatch[1])}
          </strong>
        );
        remaining = remaining.slice(boldHtmlMatch[0].length);
        continue;
      }

      const boldMdMatch = remaining.match(/^\*\*([\s\S]*?)\*\*/);
      if (boldMdMatch) {
        tokens.push(
          <strong key={key++} className="font-bold text-neutral-900 dark:text-white">
            {renderInline(boldMdMatch[1])}
          </strong>
        );
        remaining = remaining.slice(boldMdMatch[0].length);
        continue;
      }

      // Italic: <i>...</i> or *...*
      const italicHtmlMatch = remaining.match(/^<i>([\s\S]*?)<\/i>/i);
      if (italicHtmlMatch) {
        tokens.push(
          <em key={key++} className="italic">
            {renderInline(italicHtmlMatch[1])}
          </em>
        );
        remaining = remaining.slice(italicHtmlMatch[0].length);
        continue;
      }

      const italicMdMatch = remaining.match(/^\*([\s\S]*?)\*/);
      if (italicMdMatch) {
        tokens.push(
          <em key={key++} className="italic">
            {renderInline(italicMdMatch[1])}
          </em>
        );
        remaining = remaining.slice(italicMdMatch[0].length);
        continue;
      }

      // Strikethrough: ~~...~~
      const strikeMatch = remaining.match(/^~~([\s\S]*?)~~/);
      if (strikeMatch) {
        tokens.push(
          <del key={key++} className="line-through text-neutral-400">
            {renderInline(strikeMatch[1])}
          </del>
        );
        remaining = remaining.slice(strikeMatch[0].length);
        continue;
      }

      // Plain text up to the next special marker
      const nextSpecial = remaining.search(/<verse>|<mark>|<u>|<b>|<i>|\*\*|\*|~~/i);
      if (nextSpecial === -1) {
        tokens.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Just take 1 char if no regex matched
        tokens.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        tokens.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return tokens;
  };

  return (
    <div className={`rich-text-content space-y-3.5 leading-relaxed ${className}`}>
      {blocks.map((block, index) => {
        const trimmed = block.trim();

        // Heading 1
        if (trimmed.startsWith('# ')) {
          return (
            <h2
              key={index}
              className="text-xl sm:text-2xl font-extrabold font-display-scripture text-neutral-900 dark:text-white mt-4 mb-2 tracking-tight"
            >
              {renderInline(trimmed.replace('# ', ''))}
            </h2>
          );
        }

        // Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={index}
              className="text-lg sm:text-xl font-bold font-display-scripture text-neutral-900 dark:text-white mt-4 mb-1.5"
            >
              {renderInline(trimmed.replace('## ', ''))}
            </h3>
          );
        }

        // Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={index}
              className="text-base sm:text-lg font-bold font-display-scripture text-neutral-900 dark:text-white mt-3 mb-1"
            >
              {renderInline(trimmed.replace('### ', ''))}
            </h4>
          );
        }

        // Blockquote / Scripture Callout
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={index}
              className="p-4 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/60 border-l-4 border-[#5E72E4] font-serif-reading italic text-sm sm:text-base text-neutral-800 dark:text-neutral-200 my-3"
            >
              {renderInline(trimmed.replace(/^>\s*/gm, ''))}
            </blockquote>
          );
        }

        // Bullet lists
        if (trimmed.split('\n').every((line) => line.trim().startsWith('- ') || line.trim().startsWith('• '))) {
          const lines = trimmed.split('\n');
          return (
            <ul key={index} className="list-disc list-inside space-y-1.5 pl-2 text-sm sm:text-base text-neutral-700 dark:text-neutral-300">
              {lines.map((line, liIdx) => (
                <li key={liIdx}>
                  {renderInline(line.trim().replace(/^[-•]\s*/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        // Standard Paragraph with soft line breaks
        const lines = trimmed.split('\n');
        return (
          <p key={index} className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};
