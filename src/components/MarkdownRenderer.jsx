import { useMemo, useRef } from 'react';
import { marked } from 'marked';
import { useMermaid } from '../hooks/useMermaid';

/**
 * MarkdownRenderer — renders markdown to HTML via `marked`, then converts
 * ```mermaid fenced blocks into rendered SVG diagrams.
 *
 * Purely presentational: markdown text arrives via props.
 */
export default function MarkdownRenderer({ markdown = '', className = 'md-rendered' }) {
  const ref = useRef(null);
  const html = useMemo(() => (markdown ? marked.parse(markdown) : ''), [markdown]);
  useMermaid(ref, [html]);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
