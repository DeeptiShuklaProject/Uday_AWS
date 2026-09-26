import { useCallback, useEffect } from 'react';
import { useCourse } from '../context/CourseContext';

/**
 * Lab notes persistence for a single module.
 *
 * Save order mirrors the vanilla implementation:
 *   1. POST {endpoint}/{moduleId}  (lab-server persists to labs/ on disk)
 *   2. localStorage fallback when the API is unreachable
 *
 * `hasNotes` is reported into CourseContext so trigger-button badges
 * elsewhere in the UI stay in sync.
 *
 * @param {string} moduleId
 * @param {object} opts
 * @param {string} opts.endpoint      - notes API base (e.g. '/api/lab')
 * @param {string} opts.storagePrefix - localStorage key prefix
 */
export function useLabNotes(moduleId, { endpoint = '/api/lab', storagePrefix = 'lab-notes' } = {}) {
  const { reportNotesStatus } = useCourse();
  const storageKey = `${storagePrefix}-${moduleId}`;

  const load = useCallback(async () => {
    let content = '';
    try {
      const res = await fetch(`${endpoint}/${moduleId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      content = data.content || '';
    } catch {
      content = localStorage.getItem(storageKey) || '';
    }
    reportNotesStatus(moduleId, !!content.trim() && content.trim() !== '<br>');
    return content;
  }, [moduleId, endpoint, storageKey, reportNotesStatus]);

  const save = useCallback(async (content) => {
    const clean = content && content.trim() !== '<br>' ? content : '';
    let target = 'server';
    try {
      const res = await fetch(`${endpoint}/${moduleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: clean }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      localStorage.setItem(storageKey, clean);
      target = 'local';
    }
    reportNotesStatus(moduleId, !!clean.trim());
    return target;
  }, [moduleId, endpoint, storageKey, reportNotesStatus]);

  // Keep the badge in sync when the module changes.
  useEffect(() => { load(); }, [load]);

  return { load, save };
}
