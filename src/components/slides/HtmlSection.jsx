import { useRef } from 'react';
import { useMermaid } from '../../hooks/useMermaid';

/**
 * HtmlSection — renders authored HTML content for text-style sections
 * (text / why / concept / expected-output / what-happened / cleanup / fallback).
 * ```mermaid fenced blocks are rendered as SVG diagrams on demand.
 */
export default function HtmlSection({ content }) {
  const html = typeof content === 'string' ? content : content?.html || '';
  const ref = useRef(null);
  useMermaid(ref, [html]);
  return (
    <div
      ref={ref}
      className="slide-html"
      style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--color-neutral-700)' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
