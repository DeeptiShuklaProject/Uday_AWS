import { useMemo, useRef } from 'react';
import { marked } from 'marked';
import { useMermaid } from '../hooks/useMermaid';
import { resolveMediaUrls } from '../utils/markdown';

/**
 * MarkdownRenderer — renders markdown to HTML via `marked`, then converts
 * ```mermaid fenced blocks into rendered SVG diagrams.
 *
 * Purely presentational: markdown text arrives via props. `imageBaseUrl`
 * rewrites relative media srcs so images referenced from markdown resolve
 * against the content base (e.g. /chapters/) rather than the page URL.
 */
export default function MarkdownRenderer({ markdown = '', imageBaseUrl = '', className = 'md-rendered' }) {
  const ref = useRef(null);
  const html = useMemo(
    () => (markdown ? resolveMediaUrls(marked.parse(markdown), imageBaseUrl) : ''),
    [markdown, imageBaseUrl]
  );
  useMermaid(ref, [html]);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
