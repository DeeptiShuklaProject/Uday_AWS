/**
 * HtmlSection — renders authored HTML content for text-style sections
 * (text / why / concept / expected-output / what-happened / cleanup / fallback).
 */
export default function HtmlSection({ content }) {
  const html = typeof content === 'string' ? content : content?.html || '';
  return (
    <div
      className="slide-html"
      style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--color-neutral-700)' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
