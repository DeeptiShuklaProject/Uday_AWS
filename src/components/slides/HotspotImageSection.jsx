import { useState } from 'react';
import { decodeEntities } from '../../utils/entities';

/**
 * HotspotImageSection — an image with clickable hotspot regions laid
 * over it. Positions are percentages of the image box, so hotspots stay
 * aligned at every viewport size. 100% data-driven — image, regions,
 * labels and targets all come from authoring content.
 *
 * Click behavior reuses the course's own navigation:
 *   - in-page `to` → resolve the section element (exact id, then a
 *     [data-section-id*="frag"] substring match so links survive
 *     section-index shifts), update location.hash via replaceState
 *     (same as the scroll-spy), smooth-scroll, flash-highlight.
 *   - route `to` ("/courses/…#frag" or full URL) → navigate; the
 *     chapter page's deep-link restore lands on the section.
 *
 * content = {
 *   src: string                      // image url
 *   alt?: string
 *   caption?: string
 *   hotspots?: [{
 *     x, y, w, h   // percentages of the image box
 *     label        // aria-label + fallback tooltip
 *     tip?         // tooltip text
 *     to           // "sec-slug-frag" | "/courses/…#frag" | url
 *     num?         // small badge chip (e.g. the step number)
 *   }]
 * }
 */
export default function HotspotImageSection({ content }) {
  const [active, setActive] = useState(null);
  const c = content || {};
  const spots = Array.isArray(c.hotspots) ? c.hotspots : [];

  const flash = el => {
    el.classList.add('hi-flash');
    setTimeout(() => el.classList.remove('hi-flash'), 2400);
  };

  const jump = (h, i) => {
    setActive(i);
    const to = decodeEntities(h.to || '');
    if (!to) return;
    if (to.startsWith('/') || /^https?:/i.test(to)) {
      window.location.assign(to);
      return;
    }
    const frag = to.replace(/^#/, '');
    const el = document.getElementById(frag)
      || document.querySelector(`[data-section-id*="${frag}"]`);
    if (!el) return;
    const sid = el.dataset?.sectionId || el.id;
    if (sid && window.location.hash !== `#${sid}`) {
      window.history.replaceState(null, '', `#${sid}`);
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    flash(el);
    // The scroll-spy reports the deepest section whose top has crossed
    // mid-viewport; for targets shorter than that band it can overwrite
    // this hash with a later section as the smooth scroll settles.
    // Re-assert the intended target once the scroll has finished.
    if (sid) setTimeout(() => {
      if (window.location.hash !== `#${sid}`) {
        window.history.replaceState(null, '', `#${sid}`);
      }
    }, 1500);
  };

  if (!c.src) return null;
  return (
    <figure className="hi-wrap">
      <div className="hi-img-box">
        <img src={c.src} alt={decodeEntities(c.alt || '')} />
        {spots.map((h, i) => (
          <button
            key={i}
            type="button"
            className={`hi-spot${active === i ? ' hi-active' : ''}`}
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
            aria-label={decodeEntities(h.label || `Hotspot ${i + 1}`)}
            data-tip={decodeEntities(h.tip || h.label || '')}
            onClick={() => jump(h, i)}
          >
            {h.num != null && <span className="hi-num">{h.num}</span>}
          </button>
        ))}
      </div>
      {c.caption && <figcaption className="hi-caption">{decodeEntities(c.caption)}</figcaption>}
    </figure>
  );
}
