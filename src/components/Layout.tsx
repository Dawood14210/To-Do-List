import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toast } from './Toast';

interface LayoutProps {
  /** Optional enhanced theme toggle (confetti, toast) supplied by App. */
  onToggleTheme?: () => void;
}

/**
 * App shell: desktop left sidebar + sticky header, mobile bottom tab bar.
 * Toast stack floats above everything.
 */
export function Layout({ onToggleTheme }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <div className="flex">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header onToggleTheme={onToggleTheme} />

          <main
            id="main-content"
            className="px-safe mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-safe-tabbar"
          >
            <Outlet />
          </main>
        </div>
      </div>

      <BottomNav />
      <Toast />
    </div>
  );
}
