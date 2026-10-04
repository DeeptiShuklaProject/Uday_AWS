import { useMemo, useState, useEffect } from 'react';
import { decodeEntities } from '../../utils/entities';

/**
 * ConversationalNotesSection — renders a dialogue as a chat-style card.
 * 100% data-driven — speakers, roles, colors and messages all come from
 * the authoring content.
 *
 * content = {
 *   title?: string
 *   hint?: string
 *   speakers?: [{ id, name, role?, avatar?, side?: 'left'|'right', color? }]
 *   messages: [{ who, text, note? }]      // `who` = speaker id
 *   autoPlay?: bool                       // reveal messages one-by-one
 *   stepMs?: number                       // reveal interval (default 900)
 * }
 *
 * Speaker fields fall back gracefully: unknown `who` → initials avatar,
 * left side, neutral color.
 */

const FALLBACK_COLORS = ['#fb923c', '#38bdf8', '#34d399', '#e879f9', '#f59e0b', '#818cf8', '#f87171'];

export default function ConversationalNotesSection({ content = {} }) {
  const {
    title = 'Conversational Notes',
    hint = '',
    speakers = [],
    messages = [],
    autoPlay = true,
    stepMs = 900,
  } = content;

  const roster = useMemo(() => {
    const map = {};
    speakers.forEach(s => { map[s.id] = s; });
    // auto-register unknown speakers in message order
    let fi = 0;
    messages.forEach(m => {
      if (!map[m.who]) {
        map[m.who] = {
          id: m.who, name: m.who, side: 'left',
          color: FALLBACK_COLORS[fi++ % FALLBACK_COLORS.length],
          avatar: m.who.slice(0, 1).toUpperCase(),
        };
      }
    });
    return map;
  }, [speakers, messages]);

  const [visible, setVisible] = useState(autoPlay ? 0 : messages.length);

  useEffect(() => {
    if (!autoPlay) return;
    setVisible(0);
    if (!messages.length) return;
    const t = setInterval(() => {
      setVisible(v => {
        if (v >= messages.length) { clearInterval(t); return v; }
        return v + 1;
      });
    }, stepMs);
    return () => clearInterval(t);
  }, [autoPlay, stepMs, messages.length]);

  const showAll = () => setVisible(messages.length);
  const replay = () => { setVisible(0); setTimeout(() => setVisible(1), 60); };

  const initials = (name = '') =>
    name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="cn-wrap">
      <div className="diagram-titlebar">
        <span className="diagram-title">💬 {title}</span>
        <span className="diagram-hint">
          {hint || 'Dialogue-style notes from the video'}
          {visible < messages.length
            ? <button className="cn-skip" onClick={showAll}>Skip ▸▸</button>
            : autoPlay && <button className="cn-skip" onClick={replay}>↺ Replay</button>}
        </span>
      </div>

      <div className="cn-body">
        {messages.slice(0, visible).map((m, i) => {
          const sp = roster[m.who] || {};
          const right = sp.side === 'right';
          const color = sp.color || '#64748b';
          return (
            <div key={i} className={`cn-row ${right ? 'cn-right' : 'cn-left'}`}
              style={{ animationDelay: '0s' }}>
              {!right && (
                <div className="cn-avatar" style={{ background: color }}>
                  {sp.avatar || initials(sp.name || m.who)}
                </div>
              )}
              <div className="cn-bubble" style={{ borderColor: `${color}55` }}>
                <div className="cn-who" style={{ color }}>
                  {decodeEntities(sp.name || m.who)}
                  {sp.role && <span className="cn-role">{decodeEntities(sp.role)}</span>}
                </div>
                <div className="cn-text">{decodeEntities(m.text)}</div>
                {m.note && <div className="cn-note">💡 {decodeEntities(m.note)}</div>}
              </div>
              {right && (
                <div className="cn-avatar" style={{ background: color }}>
                  {sp.avatar || initials(sp.name || m.who)}
                </div>
              )}
            </div>
          );
        })}
        {visible === 0 && <div className="cn-empty">…</div>}
      </div>
    </div>
  );
}
