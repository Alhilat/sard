import React, { useMemo, useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface ArticleMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Safely parse inline markdown (bold, italic, inline code, links, strikethrough)
 */
function parseInline(text: string): React.ReactNode[] {
  // Regex pattern matching:
  // 1. Inline code: `code`
  // 2. Bold/italic: ***text***
  // 3. Bold: **text** or __text__
  // 4. Italic: *text* or _text_
  // 5. Strikethrough: ~~text~~
  // 6. Link: [text](url)
  const pattern = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Inline code
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md bg-muted/80 text-primary font-mono text-xs border border-border/50 font-semibold"
          dir="ltr"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold + Italic ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return (
        <strong key={idx} className="font-black italic text-foreground">
          {part.slice(3, -3)}
        </strong>
      );
    }

    // Bold **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={idx} className="font-extrabold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={idx} className="italic text-foreground/90 font-medium">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Strikethrough ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <del key={idx} className="line-through text-muted-foreground">
          {part.slice(2, -2)}
        </del>
      );
    }

    // Link [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      let url = linkMatch[2].trim();

      // Safe URL check
      const isSafe = /^(https?:\/\/|\/|mailto:)/i.test(url);
      if (!isSafe) {
        url = '#' + url;
      }

      return (
        <a
          key={idx}
          href={url}
          target={url.startsWith('http') ? '_blank' : undefined}
          rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-primary hover:text-primary/80 underline decoration-primary/40 hover:decoration-primary font-semibold inline-flex items-center gap-0.5 transition-colors"
        >
          <span>{label}</span>
          {url.startsWith('http') && <ExternalLink className="w-3 h-3 inline-block opacity-70" />}
        </a>
      );
    }

    return part;
  });
}

function CodeBlockItem({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-5 rounded-2xl overflow-hidden border border-border/80 bg-muted/40 shadow-xs" dir="ltr">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border/60 text-xs text-muted-foreground font-mono">
        <span className="font-semibold uppercase tracking-wider text-[11px] text-foreground/80">
          {lang || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-background/80 transition-colors text-xs font-sans text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-bold">تم النسخ</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>نسخ الكود</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-foreground/90 selection:bg-primary/30">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function ArticleMarkdown({ content, className = '' }: ArticleMarkdownProps) {
  const blocks = useMemo(() => {
    if (!content) return [];

    const lines = content.split(/\r?\n/);
    const parsed: Array<
      | { type: 'h1' | 'h2' | 'h3'; text: string }
      | { type: 'hr' }
      | { type: 'blockquote'; text: string }
      | { type: 'ul'; items: string[] }
      | { type: 'ol'; items: string[] }
      | { type: 'codeblock'; code: string; lang?: string }
      | { type: 'p'; text: string }
    > = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        i++;
        continue;
      }

      // Code blocks (```lang ... ```)
      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; // skip closing ```
        parsed.push({
          type: 'codeblock',
          code: codeLines.join('\n'),
          lang: lang || undefined,
        });
        continue;
      }

      // Horizontal rule
      if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        parsed.push({ type: 'hr' });
        i++;
        continue;
      }

      // Headings
      if (trimmed.startsWith('# ')) {
        parsed.push({ type: 'h1', text: trimmed.slice(2).trim() });
        i++;
        continue;
      }
      if (trimmed.startsWith('## ')) {
        parsed.push({ type: 'h2', text: trimmed.slice(3).trim() });
        i++;
        continue;
      }
      if (trimmed.startsWith('### ')) {
        parsed.push({ type: 'h3', text: trimmed.slice(4).trim() });
        i++;
        continue;
      }

      // Blockquotes
      if (trimmed.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        parsed.push({
          type: 'blockquote',
          text: quoteLines.join(' '),
        });
        continue;
      }

      // Unordered lists (- or *)
      if (/^[-*]\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
          i++;
        }
        parsed.push({ type: 'ul', items });
        continue;
      }

      // Ordered lists (1. , 2. )
      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        parsed.push({ type: 'ol', items });
        continue;
      }

      // Standard Paragraph
      const pLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('>') &&
        !/^[-*]\s+/.test(lines[i].trim()) &&
        !/^\d+\.\s+/.test(lines[i].trim()) &&
        !/^(\-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
      ) {
        pLines.push(lines[i]);
        i++;
      }
      parsed.push({ type: 'p', text: pLines.join('\n') });
    }

    return parsed;
  }, [content]);

  return (
    <div className={`space-y-6 text-foreground/90 font-normal leading-relaxed text-justify rtl ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h2
                key={idx}
                className="text-2xl sm:text-3xl font-black text-foreground pt-4 pb-1 border-b border-border/60 first:pt-0"
              >
                {parseInline(block.text)}
              </h2>
            );
          case 'h2':
            return (
              <h3
                key={idx}
                className="text-xl sm:text-2xl font-black text-foreground pt-3 pb-1 flex items-center gap-2 first:pt-0"
              >
                <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0" />
                <span>{parseInline(block.text)}</span>
              </h3>
            );
          case 'h3':
            return (
              <h4 key={idx} className="text-lg font-extrabold text-foreground pt-2">
                {parseInline(block.text)}
              </h4>
            );
          case 'hr':
            return <hr key={idx} className="my-8 border-t border-border/80" />;
          case 'blockquote':
            return (
              <blockquote
                key={idx}
                className="my-5 p-4 sm:p-5 border-s-4 border-primary bg-primary/5 rounded-e-2xl text-foreground font-medium text-sm sm:text-base leading-relaxed italic"
              >
                {parseInline(block.text)}
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={idx} className="my-4 space-y-2 list-disc list-inside ps-2 text-sm sm:text-base">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-foreground/90 leading-relaxed">
                    <span className="ps-1">{parseInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx} className="my-4 space-y-2 list-decimal list-inside ps-2 text-sm sm:text-base">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-foreground/90 leading-relaxed font-semibold">
                    <span className="ps-1 font-normal">{parseInline(item)}</span>
                  </li>
                ))}
              </ol>
            );
          case 'codeblock':
            return <CodeBlockItem key={idx} code={block.code} lang={block.lang} />;
          case 'p':
            return (
              <p key={idx} className="text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {parseInline(block.text)}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
