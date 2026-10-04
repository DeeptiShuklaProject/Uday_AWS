import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { decodeEntities } from '../../utils/entities';

/**
 * FlowDiagramSection — interactive architecture canvas with a
 * React-Flow look & feel: dark dotted canvas, draggable nodes with
 * handles, bezier edges, zoom controls, pan, and a click-to-inspect
 * detail panel. 100% data-driven — every node/edge/style comes from
 * the authoring content (markdown tag attrs or JSON).
 *
 * content = {
 *   title?: string
 *   hint?: string                       // titlebar hint text
 *   theme?: 'dark' | 'light'
 *   viewBox?: { w: number, h: number }  // canvas size, default 920x540
 *   nodes: [{
 *     id, label, sub?, icon?, type?: 'client'|'compute'|'security'|'storage'
 *     |'event'|'output'|'monitoring'|'network'|'trigger'|'group',
 *     x, y, w?, h?,
 *     group?: bool                      // dashed container behind children
 *     detail?: { description?, bullets?: [..] }  // click-inspect panel
 *   }]
 *   edges: [{
 *     from, to, label?, animated?, dashed?, color?, twoWay?
 *   }]
 * }
 */

const PALETTE = {
  trigger:    { stroke: '#f59e0b', glow: '#f59e0b33', icon: '🎯' },
  compute:    { stroke: '#fb923c', glow: '#fb923c33', icon: '⚙️' },
  security:   { stroke: '#f87171', glow: '#f8717133', icon: '🔒' },
  storage:    { stroke: '#60a5fa', glow: '#60a5fa33', icon: '🗄️' },
  event:      { stroke: '#34d399', glow: '#34d39933', icon: '⚡' },
  output:     { stroke: '#818cf8', glow: '#818cf833', icon: '📤' },
  monitoring: { stroke: '#e879f9', glow: '#e879f933', icon: '📊' },
  network:    { stroke: '#38bdf8', glow: '#38bdf833', icon: '🌐' },
  client:     { stroke: '#94a3b8', glow: '#94a3b833', icon: '🖥️' },
  group:      { stroke: '#475569', glow: 'transparent', icon: '' },
};

const MIN_ZOOM = 0.45, MAX_ZOOM = 2.2;

export default function FlowDiagramSection({ content = {}, inspectHint }) {
  const {
    title = 'Architecture', hint = inspectHint || 'Drag to pan · scroll to zoom · click a component to inspect',
    theme = 'dark', viewBox = { w: 920, h: 540 },
    nodes = [], edges = [],
  } = content;

  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const [selected, setSelected] = useState(null);
  const [selEdge, setSelEdge] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const wrapRef = useRef(null);
  const [wrapW, setWrapW] = useState(0);

  /* track canvas pixel width so the popup can anchor in CSS px */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWrapW(el.clientWidth));
    ro.observe(el);
    setWrapW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const cssScale = wrapW ? wrapW / viewBox.w : 1;
  /* viewBox point → CSS px inside the canvas (accounts for pan+zoom+scaling) */
  const toPx = useCallback((vx, vy) => ({
    x: (vx * zoom + pan.x) * cssScale,
    y: (vy * zoom + pan.y) * cssScale,
  }), [zoom, pan, cssScale]);

  const pick = (n) => {
    setSelEdge(null);
    setSelected(prev => (prev?.id === n.id ? null : n));
  };

  const byId = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);

  /* ── edge anchors: pick the facing sides (right→left / left→right / bottom→top) ── */
  const anchor = useCallback((n, side) => {
    const w = n.w || 190, h = n.h || 60;
    if (side === 'l') return { x: n.x, y: n.y + h / 2 };
    if (side === 'r') return { x: n.x + w, y: n.y + h / 2 };
    if (side === 't') return { x: n.x + w / 2, y: n.y };
    return { x: n.x + w / 2, y: n.y + h };
  }, []);

  const edgePath = useCallback((e) => {
    const a = byId[e.from], b = byId[e.to];
    if (!a || !b) return null;
    const aw = a.w || 190, bw = b.w || 190;
    const aCx = a.x + aw / 2, bCx = b.x + bw / 2;
    const aCy = a.y + (a.h || 60) / 2, bCy = b.y + (b.h || 60) / 2;
    let p1, p2, c1, c2;
    if (Math.abs(bCx - aCx) >= Math.abs(bCy - aCy)) {
      const dir = bCx > aCx ? ['r', 'l', 1] : ['l', 'r', -1];
      p1 = anchor(a, dir[0]); p2 = anchor(b, dir[1]);
      const dx = Math.max(40, Math.abs(p2.x - p1.x) / 2) * dir[2];
      c1 = { x: p1.x + dx, y: p1.y }; c2 = { x: p2.x - dx, y: p2.y };
    } else {
      const dir = bCy > aCy ? ['b', 't', 1] : ['t', 'b', -1];
      p1 = anchor(a, dir[0]); p2 = anchor(b, dir[1]);
      const dy = Math.max(40, Math.abs(p2.y - p1.y) / 2) * dir[2];
      c1 = { x: p1.x, y: p1.y + dy }; c2 = { x: p2.x, y: p2.y - dy };
    }
    return {
      d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`,
      from: p1, to: p2,
      mid: { x: (p1.x + 3 * c1.x + 3 * c2.x + p2.x) / 8, y: (p1.y + 3 * c1.y + 3 * c2.y + p2.y) / 8 },
    };
  }, [byId, anchor]);

  /* ── pan / zoom ── */
  const onPointerDown = (ev) => {
    if (ev.target.closest('.rfd-node') || ev.target.closest('.rfd-ctrl') || ev.target.closest('.rfd-detail')) return;
    dragRef.current = { px: ev.clientX, py: ev.clientY, ox: pan.x, oy: pan.y };
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };
  const onPointerMove = (ev) => {
    if (!dragRef.current) return;
    setPan({ x: dragRef.current.ox + ev.clientX - dragRef.current.px,
             y: dragRef.current.oy + ev.clientY - dragRef.current.py });
  };
  const onPointerUp = () => { dragRef.current = null; };
  const onWheel = (ev) => {
    ev.preventDefault();
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - Math.sign(ev.deltaY) * 0.12)));
  };
  const fitView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  /* ── minimap: scaled overview + live viewport rect, click to jump ── */
  const MM_W = 180;
  const mmScale = MM_W / viewBox.w;
  const mmH = Math.round(viewBox.h * mmScale);
  const visRect = {
    x: -pan.x / zoom, y: -pan.y / zoom,
    w: viewBox.w / zoom, h: viewBox.h / zoom,
  };
  const mmJump = (ev) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const cx = (ev.clientX - r.left) / mmScale;
    const cy = (ev.clientY - r.top) / mmScale;
    setPan({ x: viewBox.w / 2 - cx * zoom, y: viewBox.h / 2 - cy * zoom });
  };

  const connected = useMemo(() => {
    if (!selected) return new Set();
    const s = new Set([selected.id]);
    edges.forEach(e => {
      if (e.from === selected.id) s.add(e.to);
      if (e.to === selected.id) s.add(e.from);
    });
    return s;
  }, [selected, edges]);

  const bg = theme === 'dark' ? '#0b1220' : '#f8fafc';
  const dot = theme === 'dark' ? '#1e293b' : '#cbd5e1';
  const nodeBg = theme === 'dark' ? '#0f172acc' : '#ffffffdd';
  const textCol = theme === 'dark' ? '#e2e8f0' : '#1e293b';

  return (
    <div className="rfd-wrap" data-theme={theme}>
      <div className="diagram-titlebar">
        <span className="diagram-title">{title}</span>
        <span className="diagram-hint">{hint}</span>
      </div>

      <div ref={wrapRef} className="rfd-canvas"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
        onWheel={onWheel}
        style={{ background: bg }}>

        <svg viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
          style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${viewBox.w} / ${viewBox.h}`, cursor: dragRef.current ? 'grabbing' : 'grab' }}>
          <defs>
            <pattern id={`rfd-dots-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill={dot} />
            </pattern>
            <filter id={`rfd-glow-${uid}`}>
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodOpacity="0.45" />
            </filter>
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            <rect x={-viewBox.w} y={-viewBox.h} width={viewBox.w * 3} height={viewBox.h * 3}
              fill={`url(#rfd-dots-${uid})`} />

            {/* edges (bezier + handles) */}
            {edges.map((e, i) => {
              const p = edgePath(e);
              if (!p) return null;
              const active = !selected || connected.has(e.from) && connected.has(e.to);
              return (
                <g key={i} opacity={active ? 1 : 0.18} className="rfd-edge"
                  onClick={() => { setSelected(null); setSelEdge(e); }}
                  style={{ cursor: 'pointer' }}>
                  {/* invisible fat hit-area so thin edges are easy to click */}
                  <path d={p.d} fill="none" stroke="transparent" strokeWidth="14" />
                  <path d={p.d} fill="none"
                    stroke={e.color || '#64748b'} strokeWidth="1.8"
                    strokeDasharray={e.dashed ? '6 5' : (e.animated ? '7 5' : undefined)}
                    className={e.animated ? 'rfd-edge-anim' : undefined} />
                  <circle cx={p.from.x} cy={p.from.y} r="4" fill={e.color || '#64748b'} />
                  <circle cx={p.to.x} cy={p.to.y} r="4" fill={e.color || '#64748b'} />
                  {e.label && (
                    <text x={p.mid.x} y={p.mid.y - 8} textAnchor="middle"
                      fill="#94a3b8" fontSize="11" fontFamily="Inter, sans-serif"
                      style={{ paintOrder: 'stroke', stroke: bg, strokeWidth: 4 }}>
                      {e.label}
                    </text>
                  )}
                  {e.twoWay && <text x={p.mid.x} y={p.mid.y + 12} textAnchor="middle" fill="#94a3b8" fontSize="10">↔</text>}
                </g>
              );
            })}

            {/* nodes */}
            {nodes.map(n => {
              const pal = PALETTE[n.type] || PALETTE.client;
              const w = n.w || 190, h = n.h || 60;
              const isSel = selected?.id === n.id;
              const dim = selected && !connected.has(n.id);
              if (n.group) {
                return (
                  <g key={n.id} opacity={dim ? 0.25 : 1}>
                    <rect x={n.x} y={n.y} width={w} height={h} rx="14"
                      fill={pal.glow} stroke={pal.stroke} strokeWidth="1.4" strokeDasharray="5 4" />
                    <text x={n.x + 16} y={n.y + 26} fill={pal.stroke} fontSize="13" fontWeight="700"
                      fontFamily="Inter, sans-serif">{decodeEntities(`${n.icon ? n.icon + ' ' : ''}${n.label}`)}</text>
                  </g>
                );
              }
              return (
                <g key={n.id} className="rfd-node" opacity={dim ? 0.25 : 1}
                  onClick={() => pick(n)} style={{ cursor: 'pointer' }}
                  filter={isSel ? `url(#rfd-glow-${uid})` : undefined}>
                  <rect x={n.x} y={n.y} width={w} height={h} rx="12"
                    fill={nodeBg} stroke={isSel ? '#fb923c' : pal.stroke}
                    strokeWidth={isSel ? 2.4 : 1.6} />
                  <circle cx={n.x + 20} cy={n.y + h / 2} r="13"
                    fill={pal.glow} stroke={pal.stroke} strokeWidth="1" />
                  <text x={n.x + 20} y={n.y + h / 2 + 4} textAnchor="middle" fontSize="13">
                    {decodeEntities(n.icon || pal.icon)}
                  </text>
                  <text x={n.x + 40} y={n.y + (n.sub ? h / 2 - 2 : h / 2 + 5)}
                    fill={textCol} fontSize="12.5" fontWeight="600" fontFamily="Inter, sans-serif">
                    {decodeEntities(n.label)}
                  </text>
                  {n.sub && (
                    <text x={n.x + 40} y={n.y + h / 2 + 14} fill="#94a3b8"
                      fontSize="10.5" fontFamily="Inter, sans-serif">
                      {decodeEntities(n.sub)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* React-Flow-style controls */}
        <div className="rfd-ctrl">
          <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 0.2))} title="Zoom in">+</button>
          <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 0.2))} title="Zoom out">−</button>
          <button onClick={fitView} title="Fit view">⛶</button>
        </div>

        {/* minimap — scaled overview, click to jump */}
        <div className="rfd-minimap" onPointerDown={mmJump} title="Minimap — click to jump">
          <svg width={MM_W} height={mmH} viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}>
            <rect width={viewBox.w} height={viewBox.h} fill="#0f172a" />
            {edges.map((e, i) => {
              const a = byId[e.from], b = byId[e.to];
              if (!a || !b) return null;
              return <line key={i}
                x1={a.x + (a.w || 190) / 2} y1={a.y + (a.h || 60) / 2}
                x2={b.x + (b.w || 190) / 2} y2={b.y + (b.h || 60) / 2}
                stroke="#334155" strokeWidth="3" />;
            })}
            {nodes.map(n => {
              const pal = PALETTE[n.type] || PALETTE.client;
              return <rect key={n.id}
                x={n.x} y={n.y} width={n.w || 190} height={n.h || 60} rx="8"
                fill={pal.stroke} opacity={n.group ? 0.35 : 0.85}
                stroke={selected?.id === n.id ? '#fb923c' : 'none'} strokeWidth="4" />;
            })}
            <rect x={visRect.x} y={visRect.y} width={visRect.w} height={visRect.h}
              fill="#f9731618" stroke="#fb923c" strokeWidth="6" rx="10" />
          </svg>
        </div>

        {/* anchored node popup — pops out beside the clicked component */}
        {selected && !selected.group && (() => {
          const w = selected.w || 190, h = selected.h || 60;
          const below = toPx(selected.x + w / 2, selected.y + h + 12);
          const px = Math.min(Math.max(below.x, 140), (wrapW || 1200) - 150);
          const fitsBelow = below.y < (viewBox.h * cssScale) - 150;
          const py = fitsBelow ? below.y : toPx(selected.x + w / 2, selected.y - 12).y;
          return (
            <div className="rfd-pop" style={{ left: px, top: py, transform: fitsBelow ? 'translateX(-50%)' : 'translate(-50%, -100%)' }}>
              <div className="rfd-pop-arrow" data-dir={fitsBelow ? 'up' : 'down'} />
              <div className="rfd-detail-head">
                <span>{decodeEntities(selected.icon || PALETTE[selected.type]?.icon || '🧩')}</span>
                <div>
                  <div className="rfd-detail-label">{decodeEntities(selected.label)}</div>
                  {selected.sub && <div className="rfd-detail-sub">{decodeEntities(selected.sub)}</div>}
                </div>
                <button className="rfd-detail-x" onClick={() => setSelected(null)}>✕</button>
              </div>
              {selected.detail?.description && <p>{decodeEntities(selected.detail.description)}</p>}
              {selected.detail?.bullets?.length > 0 && (
                <ul>{selected.detail.bullets.map((b, i) => <li key={i}>{decodeEntities(b)}</li>)}</ul>
              )}
              {!selected.detail?.description && !selected.detail?.bullets && (
                <p>Component of the architecture — click ✕ or another node to dismiss.</p>
              )}
            </div>
          );
        })()}

        {/* edge popup — tiny card at the edge midpoint */}
        {selEdge && (() => {
          const p = edgePath(selEdge);
          if (!p) return null;
          const pt = toPx(p.mid.x, p.mid.y);
          return (
            <div className="rfd-pop rfd-pop-edge" style={{ left: pt.x, top: pt.y - 10, transform: 'translate(-50%, -100%)' }}>
              <div className="rfd-pop-arrow" data-dir="down" />
              <div className="rfd-detail-label">{decodeEntities(byId[selEdge.from]?.label || selEdge.from)} → {decodeEntities(byId[selEdge.to]?.label || selEdge.to)}</div>
              {selEdge.label && <p>{decodeEntities(selEdge.label)}</p>}
              <button className="rfd-detail-x rfd-pop-x" onClick={() => setSelEdge(null)}>✕</button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
