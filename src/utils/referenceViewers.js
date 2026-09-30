import GitHubExplorerModal from '../components/GitHubExplorerModal';

/**
 * Reference viewers — inline knowledge-base previews for links in course
 * content. A clicked link is matched by hostname and rendered inside a
 * modal so learners never leave the reading flow.
 *
 * Future providers (Docker Hub images, Kubernetes/Terraform registries,
 * docs sites…) plug in by appending { id, match, component } here — no
 * changes needed in DocChapterPage.
 */
const VIEWERS = [
  { id: 'github', match: /(^|\.)github\.com$/, component: GitHubExplorerModal },
];

/**
 * @param {string} url - clicked link href
 * @returns {React.ComponentType|null} viewer modal component, or null to
 *          let the link behave normally.
 */
export function resolveReferenceViewer(url) {
  try {
    const host = new URL(url).hostname;
    return VIEWERS.find(v => v.match.test(host))?.component || null;
  } catch {
    return null;
  }
}
