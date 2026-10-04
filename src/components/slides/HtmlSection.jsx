import { useRef, useState, useEffect } from 'react';
import { useMermaid } from '../../hooks/useMermaid';

/**
 * HtmlSection — renders authored HTML content for text-style sections
 * (text / why / concept / expected-output / what-happened / cleanup / fallback).
 * ```mermaid fenced blocks are rendered as SVG diagrams on demand.
 * Clicking a content image opens a fullscreen lightbox (Esc / click to close).
 */
export default function HtmlSection({ content }) {
  const html = typeof content === 'string' ? content : content?.html || '';
  const ref = useRef(null);
  const [zoom, setZoom] = useState(null); // { src, alt }
  useMermaid(ref, [html]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = e => e.key === 'Escape' && setZoom(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  const onClick = e => {
    const img = e.target.closest?.('img');
    if (img && !e.target.closest('a')) {
      setZoom({ src: img.currentSrc || img.src, alt: img.alt });
    }
  };

  return (
    <>
      <div
        ref={ref}
        className="slide-html"
        style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--color-neutral-700)' }}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {zoom && (
        <div className="img-zoom-overlay" onClick={() => setZoom(null)}>
          <img src={zoom.src} alt={zoom.alt} />
          {zoom.alt && <div className="img-zoom-caption">{zoom.alt}</div>}
          <span className="img-zoom-x">✕</span>
        </div>
      )}
    </>
  );
}
