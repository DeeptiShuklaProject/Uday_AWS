# FlowDiagram — copy-paste template

Interactive React-Flow-style canvas for architecture diagrams.
Paste this tag into a chapter, replace nodes/edges.

STRICT RULE — side-by-side comparison: NEVER remove the original
screenshot. Order in the markdown is always:

    <FlowDiagram … />                    ← interactive version first
    ![original slide](screenshots/…)     ← original immediately after
    *What to notice* — …compare with the original slide above.

## Skeleton

```jsx
<FlowDiagram
  title="YOUR DIAGRAM TITLE"
  theme="dark"                        // "dark" | "light"
  viewBox={{ w: 920, h: 560 }}        // canvas coordinate space
  hint="Drag to pan · scroll to zoom · click a component"
  nodes={[
    // plain node
    { id: "a", label: "Component A", sub: "subtitle", icon: "🖥️",
      type: "client", x: 40, y: 120, w: 180, h: 58,
      detail: { description: "Shown when clicked.",
                bullets: ["point 1", "point 2"] } },
    // group container (declare BEFORE its children; non-clickable)
    { id: "grp", label: "Group Name", icon: "🧩", type: "group",
      group: true, x: 240, y: 60, w: 330, h: 300 },
    // child inside the group (position with absolute coords)
    { id: "b", label: "Component B", icon: "⚙️", type: "compute",
      x: 260, y: 110, w: 290, h: 50 },
  ]}
  edges={[
    { from: "a", to: "grp", label: "flow" },
    { from: "grp", to: "b", animated: true },   // moving dashes
    { from: "b",  to: "a", dashed: true },      // dotted return path
    { from: "a",  to: "b", color: "#38bdf8" },  // custom edge color
  ]}
/>
```

## Node `type` → palette

| type | color | best for | default icon |
|---|---|---|---|
| `trigger` | amber | users, callers, entry points | 🎯 |
| `compute` | orange | services, runtimes, functions, agents | ⚙️ |
| `security` | red | identity, auth, IAM, guardrails | 🔒 |
| `storage` | blue | memory, DB, state, S3 | 🗄️ |
| `monitoring` | pink | observability, metrics, CloudWatch | 📊 |
| `network` | cyan | gateways, APIs, endpoints | 🌐 |
| `event` | green | queues, events, webhooks | ⚡ |
| `output` | indigo | responses, results | 📤 |
| `client` | slate | apps, UIs, external systems | 🖥️ |
| `group` | gray dashed | container regions (non-clickable) | — |

## Layout tips

- `viewBox` ~920×560; give nodes ~60–80px gaps.
- Left→right flow: caller x≈30–60, middle x≈240–570, targets x≈620–910.
- Bottom row (memory/observability style): y≈440–480.
- Group containers: children sit *inside* the group rect using absolute coords (group y + ~55 offset for the title row).
- Edge anchors are automatic (right→left or bottom→top by relative position).

## Node fields

```
id*      unique string — edges reference it
label*   display name
sub      subtitle line
icon     emoji (falls back to type icon)
type     palette key above
x, y*    position; w, h (default 190×60)
group    true → dashed container, non-clickable
detail   { description, bullets[] } — click-inspect panel
```

## Edge fields

```
from, to*  node ids (can point at group ids)
label      edge caption
animated   marching dashes (live flow)
dashed     static dashes (monitoring/secondary)
color      custom stroke
twoWay     shows ↔ marker
```

## Export a static SVG

```
node scripts/export-flow-diagram.mjs <chapter-md> <out.svg>
```
