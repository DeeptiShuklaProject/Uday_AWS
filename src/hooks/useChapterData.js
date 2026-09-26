import { useEffect, useState } from 'react';

/**
 * Fetch a chapter's raw markdown file.
 *
 * @param {object|null} module - registry entry carrying `mdFile`
 * @param {string} baseUrl - base URL serving the chapter files
 * @param {boolean} enabled - only fetch while true (e.g. modal open)
 * @returns {{ markdown: string|null, loading: boolean, error: string|null }}
 */
export function useChapterData(module, baseUrl = '/chapters', enabled = true) {
  const [state, setState] = useState({ markdown: null, loading: false, error: null });
  const mdFile = module?.mdFile;

  useEffect(() => {
    if (!enabled || !mdFile) return;
    let cancelled = false;
    setState({ markdown: null, loading: true, error: null });
    fetch(`${baseUrl}/${mdFile}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(markdown => !cancelled && setState({ markdown, loading: false, error: null }))
      .catch(e => !cancelled && setState({ markdown: null, loading: false, error: e.message }));
    return () => { cancelled = true; };
  }, [mdFile, baseUrl, enabled]);

  return state;
}
