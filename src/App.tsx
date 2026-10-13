import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAppStore } from './store';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { fireConfetti } from './utils/confetti';
import DashboardPage from './pages/Dashboard';
import TasksPage from './pages/Tasks';
import CalendarPage from './pages/Calendar';
import FocusPage from './pages/Focus';
import HabitsPage from './pages/Habits';
import NotesPage from './pages/Notes';
import SettingsPage from './pages/Settings';

function App() {
  // Mirror the persisted theme onto <html> for Tailwind's darkMode: 'class'.
  useTheme();
  const toast = useToast();
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  // One-time welcome toast for brand-new users (all state persists, so
  // `welcomed` keeps it from ever repeating).
  useEffect(() => {
    const store = useAppStore.getState();
    if (!store.welcomed) {
      store.showToast('Welcome! Everything you do here is saved locally.', 'success');
      store.markWelcomed();
      fireConfetti();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
    // Tiny celebration — also proves canvas-confetti is wired up.
    fireConfetti();
    const next = useAppStore.getState().settings.theme === 'dark' ? 'Dark' : 'Light';
    toast(`${next} mode on`, 'info');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onToggleTheme={handleToggleTheme} />}>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="focus" element={<FocusPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
