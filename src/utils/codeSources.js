/**
 * Code source adapters — the seam between a code-explorer spec
 * ({repo, ref, files[]}) and actual file text. The viewer component
 * never fetches directly; it receives a `fetchFile(ref, file)` function
 * so new providers (gitlab, bundled local files, …) slot in here.
 *
 * Per-file overrides (checked in order, before the repo adapter):
 *   file.content — inline text, no fetch at all
 *   file.src     — absolute URL or app-relative path ("/x/y" or "x/y"),
 *                  for files that aren't in the repo (e.g. generated
 *                  artifacts captured as course assets)
 *   file.path    — default: repo + ref + path via the provider adapter
 */
import { fetchText } from './github.js';

/**
 * GitHub adapter — resolves files via raw.githubusercontent.com.
 * `ref` is any git ref: branch name, tag or commit sha.
 */
export function githubFileFetcher(repo, {
  rawBase = 'https://raw.githubusercontent.com',
} = {}) {
  // repo may be "owner/name" or a full https://github.com/owner/name URL
  const slug = (repo || '').replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, '');
  return (ref, file) =>
    fetchText(`${rawBase}/${slug}/${ref || 'HEAD'}/${file.path}`, `src:${slug}@${ref || 'HEAD'}:${file.path}`);
}

/** Fetch a file.src — http(s) URL or path served by the app (public/). */
function srcFetcher() {
  return (ref, file) => {
    const url = /^https?:\/\//.test(file.src)
      ? file.src
      : `${file.src.startsWith('/') ? '' : '/'}${file.src}`;
    return fetchText(url, `src:${url}`);
  };
}

/**
 * Resolve a spec's repo into a fetchFile(ref, file) → Promise<string>.
 * Provider is picked by the repo URL host; per-file src/content
 * overrides let a walkthrough mix repo files with local artifacts.
 */
export function resolveFetcher(spec, overrides = {}) {
  if (overrides.fetchFile) return overrides.fetchFile;
  const gh = githubFileFetcher(spec?.repo, overrides);
  const src = srcFetcher();
  return (ref, file) => {
    if (file.content != null) return Promise.resolve(String(file.content));
    if (file.src) return src(ref, file);
    return gh(ref, file);
  };
}
