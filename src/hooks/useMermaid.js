import { useEffect } from 'react';

let mermaidPromise = null;

// Mermaid is heavy (~1 MB) — load it on demand as its own chunk.
function ensureMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
      return mermaid;
    });
  }
  return mermaidPromise;
}

/**
 * Find `pre code.language-mermaid` blocks inside a container, convert them to
 * <div class="mermaid"> elements, and render them as SVGs. Idempotent — already
 * processed nodes are skipped via mermaid's data-processed attribute.
 */
export async function renderMermaidDiagrams(container) {
  if (!container) return;

  container.querySelectorAll('pre code.language-mermaid').forEach(codeEl => {
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = codeEl.textContent;
    codeEl.parentElement.replaceWith(div);
  });

  const nodes = Array.from(container.querySelectorAll('.mermaid:not([data-processed])'));
  if (nodes.length === 0) return;

  try {
    const m = await ensureMermaid();
    await m.run({ nodes });
  } catch (e) {
    console.warn('Mermaid rendering error:', e);
  }
}

/**
 * Re-render any mermaid code blocks inside `ref` whenever deps change.
 */
export function useMermaid(ref, deps = []) {
  useEffect(() => {
    renderMermaidDiagrams(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
