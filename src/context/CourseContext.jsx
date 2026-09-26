import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const CourseContext = createContext(null);

function freshProgress() {
  return { version: 1, startedAt: new Date().toISOString(), modules: {} };
}

function loadProgress(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && parsed.modules ? parsed : freshProgress();
  } catch {
    return freshProgress();
  }
}

/**
 * CourseProvider — global course state.
 *
 * 100% data-driven: every string/endpoint arrives via props so the provider
 * can front any course registry without edits.
 *
 * @param {object} props
 * @param {object} props.registry        - courseRegistry.json shape
 * @param {string} props.progressStorageKey
 * @param {string} props.themeStorageKey
 * @param {object} props.config          - { notesEndpoint, chapterBaseUrl }
 */
export function CourseProvider({
  registry,
  progressStorageKey = 'course-progress',
  themeStorageKey = 'course-theme',
  config = {},
  onModuleSelect, // optional callback: fired with moduleId when a component jumps chapters
  children,
}) {
  const modules = registry?.modules || [];

  // ── Current chapter (route-driven; components jump via goToModule) ──
  const [currentModuleId, setCurrentModuleId] = useState(modules[0]?.id || null);
  const currentModule = modules.find(m => m.id === currentModuleId) || null;

  /**
   * goToModule — chapter switch used by Sidebar / NextSection.
   * Sets context AND fires onModuleSelect (wired to router navigation in
   * the app shell) atomically — never a separate sync effect, which would
   * ping-pong route<->context.
   */
  const goToModule = useCallback((id) => {
    setCurrentModuleId(id);
    onModuleSelect?.(id);
  }, [onModuleSelect]);

  // ── Modal coordination ──
  const [activeModal, setActiveModal] = useState(null); // 'details' | 'labs' | null
  const openModal = useCallback(id => setActiveModal(id), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  // ── Lab-notes presence badges: { [moduleId]: boolean } ──
  const [notesStatus, setNotesStatus] = useState({});
  const reportNotesStatus = useCallback((moduleId, has) => {
    setNotesStatus(s => (s[moduleId] === has ? s : { ...s, [moduleId]: has }));
  }, []);

  // ── Theme ──
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(themeStorageKey) || 'light'; } catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(themeStorageKey, theme); } catch { /* ignore */ }
  }, [theme, themeStorageKey]);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);

  // ── Progress (localStorage-backed) ──
  const [progressData, setProgressData] = useState(() => loadProgress(progressStorageKey));
  const persistRef = useRef(progressStorageKey);
  persistRef.current = progressStorageKey;
  useEffect(() => {
    try { localStorage.setItem(persistRef.current, JSON.stringify(progressData)); } catch { /* ignore */ }
  }, [progressData]);

  const markSectionComplete = useCallback((moduleId, sectionId, complete = true) => {
    setProgressData(d => {
      const mod = d.modules[moduleId] || { completed: [] };
      const has = mod.completed.includes(sectionId);
      if (has === complete) return d;
      const completed = complete
        ? [...mod.completed, sectionId]
        : mod.completed.filter(s => s !== sectionId);
      return { ...d, modules: { ...d.modules, [moduleId]: { ...mod, completed } } };
    });
  }, []);

  const progress = useMemo(() => {
    const sectionTotal = id => modules.find(m => m.id === id)?.sectionCount || 0;
    const completedCount = id => progressData.modules[id]?.completed?.length || 0;
    return {
      isSectionComplete: (moduleId, sectionId) =>
        !!progressData.modules[moduleId]?.completed?.includes(sectionId),
      markSectionComplete,
      getModuleProgress: (moduleId) => {
        const total = sectionTotal(moduleId);
        return total === 0 ? 0 : Math.min(100, Math.round((completedCount(moduleId) / total) * 100));
      },
      isModuleComplete: (moduleId) => {
        const total = sectionTotal(moduleId);
        return total > 0 && completedCount(moduleId) >= total;
      },
      getOverallProgress: () => {
        const total = modules.reduce((s, m) => s + (m.sectionCount || 0), 0);
        if (total === 0) return 0;
        const done = modules.reduce((s, m) => s + Math.min(completedCount(m.id), m.sectionCount || 0), 0);
        return Math.round((done / total) * 100);
      },
    };
  }, [progressData, modules, markSectionComplete]);

  const value = useMemo(() => ({
    registry,
    course: { id: registry?.id, title: registry?.title, subtitle: registry?.subtitle, description: registry?.description },
    modules,
    currentModuleId,
    currentModule,
    setCurrentModuleId,
    goToModule,
    activeModal,
    openModal,
    closeModal,
    notesStatus,
    reportNotesStatus,
    theme,
    toggleTheme,
    progress,
    config: { notesEndpoint: '/api/lab', chapterBaseUrl: '/chapters', ...config },
  }), [registry, modules, currentModuleId, currentModule, goToModule, activeModal, openModal,
       closeModal, notesStatus, reportNotesStatus, theme, toggleTheme, progress, config]);

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error('useCourse must be used inside <CourseProvider>');
  return ctx;
}
