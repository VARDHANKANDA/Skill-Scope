/**
 * Lightweight inline markdown renderer — no external dependencies.
 * Handles: bold, italic, inline code, # headings, - bullets, numbered lists, code blocks.
 */

import { Fragment } from 'react';

function renderInline(text: string): React.ReactNode {
  // Split on bold **text**, italic *text*, inline `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-muted px-1 py-0.5 rounded text-[0.85em] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block fence
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="bg-muted rounded-md p-3 my-2 overflow-x-auto text-xs font-mono whitespace-pre">
          {codeLines.join('\n')}
        </pre>
      );
      i++; // skip closing ```
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cls = level === 1 ? 'text-base font-bold mt-3 mb-1' : level === 2 ? 'text-sm font-bold mt-2 mb-0.5' : 'text-sm font-semibold mt-1';
      elements.push(<p key={i} className={cls}>{renderInline(headingMatch[2])}</p>);
      i++;
      continue;
    }

    // Unordered list item
    const ulMatch = line.match(/^[\s]*[-*+]\s+(.*)/);
    if (ulMatch) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[\s]*[-*+]\s+(.*)/)) {
        const m = lines[i].match(/^[\s]*[-*+]\s+(.*)/);
        items.push(<li key={i}>{renderInline(m![1])}</li>);
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 my-1.5 space-y-0.5 text-sm">
          {items}
        </ul>
      );
      continue;
    }

    // Ordered list item
    const olMatch = line.match(/^[\s]*\d+[.)]\s+(.*)/);
    if (olMatch) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[\s]*\d+[.)]\s+(.*)/)) {
        const m = lines[i].match(/^[\s]*\d+[.)]\s+(.*)/);
        items.push(<li key={i}>{renderInline(m![1])}</li>);
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 my-1.5 space-y-0.5 text-sm">
          {items}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
      i++;
      continue;
    }

    // Normal paragraph line
    elements.push(
      <p key={i} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}
