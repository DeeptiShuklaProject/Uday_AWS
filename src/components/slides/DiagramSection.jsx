import { useId, useState } from 'react';
import { decodeEntities } from '../../utils/entities';

const NODE_COLORS = {
  trigger:    { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  compute:    { bg: '#fed7aa', border: '#f97316', text: '#9a3412' },
  storage:    { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  event:      { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  output:     { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  client:     { bg: '#f1f5f9', border: '#64748b', text: '#334155' },
  monitoring: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  security:   { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  network:    { bg: '#e0f2fe', border: '#0ea5e9', text: '#075985' },
};

/**
 * DiagramSection — interactive SVG architecture diagram.
 * Port of the vanilla DiagramEngine: nodes (clickable → detail panel) and
 * labelled edges with optional animated dashes.
 */
export default function DiagramSection({ content = {}, inspectHint = 'Click components to inspect' }) {
  const uid = useId().replace(/:/g, '');
  const [selected, setSelected] = useState(null);
  const nodes = content.nodes || [];
  const edges = content.edges || [];
  const width = content.width || 800;
  const height = content.height || 400;
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <div className="diagram-wrapper">
      {content.title && (
        <div className="diagram-titlebar">
          <span style={{ fontSize: 18 }}>📐</span>
          <span className="diagram-title">{content.title}</span>
          <span className="diagram-hint">{inspectHint}</span>
        </div>
      )}
      <div className="diagram-scroll">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', margin: '0 auto' }}>
          <defs>
            <marker id={`arrow-${uid}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
            <filter id={`shadow-${uid}`}>
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
            </filter>
          </defs>
          {edges.map((e, i) => {
            const from = byId[e.from]; const to = byId[e.to];
            if (!from || !to) return null;
            const x1 = from.x + 60, y1 = from.y + 30, x2 = to.x + 60, y2 = to.y + 30;
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="2"
                  markerEnd={`url(#arrow-${uid})`}
                  strokeDasharray={e.animated ? '8 4' : undefined}
                  className={e.animated ? 'diagram-edge-animated' : undefined} />
                {e.label && (
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle"
                    fill="#94a3b8" fontSize="11" fontFamily="Inter, sans-serif">{e.label}</text>
                )}
              </g>
            );
          })}
          {nodes.map(node => {
            const colors = NODE_COLORS[node.type] || NODE_COLORS.client;
            return (
              <g key={node.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(node)}>
                <rect x={node.x} y={node.y} width="120" height="60" rx="10"
                  fill={colors.bg} stroke={selected?.id === node.id ? '#f97316' : colors.border}
                  strokeWidth={selected?.id === node.id ? 3 : 2}
                  filter={`url(#shadow-${uid})`} />
                <text x={node.x + 60} y={node.y + 22} textAnchor="middle" fontSize="18">
                  {decodeEntities(node.icon || '☁️')}
                </text>
                <text x={node.x + 60} y={node.y + 44} textAnchor="middle" fill={colors.text}
                  fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                  {decodeEntities(node.label)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {selected && (
        <div className="diagram-detail">
          <div className="diagram-detail-head">
            <span style={{ fontSize: 24 }}>{decodeEntities(selected.icon || '☁️')}</span>
            <div>
              <div className="diagram-detail-label">{decodeEntities(selected.label)}</div>
              <div className="diagram-detail-type">{selected.type || ''}</div>
            </div>
          </div>
          {selected.description && <div className="diagram-detail-desc">{selected.description}</div>}
          {selected.eventPayload && (
            <>
              <div className="diagram-detail-payload-label">Event Payload</div>
              <pre className="diagram-detail-payload">
                {typeof selected.eventPayload === 'string'
                  ? selected.eventPayload
                  : JSON.stringify(selected.eventPayload, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
