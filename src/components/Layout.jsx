import { useEffect, useState } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

/**
 * Layout — app shell: fixed TopBar, collapsible Sidebar, main content area
 * and an optional right-side context panel (desktop ≥1440px via CSS).
 * Receives all labels/data via props; purely presentational.
 */
export default function Layout({ topBarProps = {}, sideBarProps = {}, contextPanel, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile sidebar on outside click (mirrors vanilla behavior).
  useEffect(() => {
    if (!sidebarOpen) return;
    const onDocClick = (e) => {
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.topbar-menu-btn');
      if (sidebar && !sidebar.contains(e.target) && !(toggle && toggle.contains(e.target))) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [sidebarOpen]);

  return (
    <>
      <TopBar {...topBarProps} onMenuToggle={() => setSidebarOpen(o => !o)} />
      <div className="app">
        <Sidebar {...sideBarProps} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <div className="lesson-container">{children}</div>
        </main>
        {contextPanel}
      </div>
    </>
  );
}
