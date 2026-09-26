import { useEffect, useState } from 'react';
import { moduleLoaders } from '../data/modules';

/**
 * Lazily load the slide/section data for a module via code-split
 * dynamic imports (each chapter is a separate webpack/vite chunk).
 *
 * @returns {{ data: object|null, loading: boolean, error: Error|null }}
 */
export function useModuleSlides(moduleId) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    const loader = moduleLoaders[moduleId];
    if (!loader) {
      setState({ data: null, loading: false, error: new Error(`No data loader for ${moduleId}`) });
      return;
    }
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));
    loader()
      .then(m => !cancelled && setState({ data: m.default, loading: false, error: null }))
      .catch(error => !cancelled && setState({ data: null, loading: false, error }));
    return () => { cancelled = true; };
  }, [moduleId]);

  return state;
}
