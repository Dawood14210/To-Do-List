import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAppStore } from './store';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { fireConfetti } from './utils/confetti';
import { isNative } from './utils/native';
import { installAndroidBackButton } from './utils/backButton';
import { installReminderSync, resyncOnResume } from './utils/reminders';
import DashboardPage from './pages/Dashboard';
import TasksPage from './pages/Tasks';
import CalendarPage from './pages/Calendar';
import CategoriesPage from './pages/Categories';
import FocusPage from './pages/Focus';
import HabitsPage from './pages/Habits';
import NotesPage from './pages/Notes';
import SettingsPage from './pages/Settings';

/**
 * Everything inside the router. Kept separate so the native wiring can use
 * `useNavigate` (the back button needs real router history).
 */
function AppShell() {
  // Mirror the persisted theme onto <html> for Tailwind's darkMode: 'class'
  // and onto the Android status bar.
  useTheme();
  const toast = useToast();
  const navigate = useNavigate();
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

  /* ---------------- native shell (no-ops on the web) ---------------- */

  // Android back button: modals → history → exit.
  useEffect(() => installAndroidBackButton(), []);

  // Keep the OS reminders in step with the task list, catch up on resume and
  // jump to the task list when a reminder is tapped.
  useEffect(() => {
    const stopReminderSync = installReminderSync();
    if (!isNative()) return stopReminderSync;

    let cancelled = false;
    const cleanups: Array<() => void> = [];

    void import('@capacitor/app')
      .then(({ App }) =>
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) void resyncOnResume();
        })
      )
      .then((listener) => {
        if (cancelled) void listener.remove();
        else cleanups.push(() => void listener.remove());
      })
      .catch(() => undefined);

    void import('@capacitor/local-notifications')
      .then(({ LocalNotifications }) =>
        LocalNotifications.addListener('localNotificationActionPerformed', () => {
          navigate('/tasks');
        })
      )
      .then((listener) => {
        if (cancelled) void listener.remove();
        else cleanups.push(() => void listener.remove());
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
      stopReminderSync();
    };
  }, [navigate]);

  const handleToggleTheme = () => {
    toggleTheme();
    // Tiny celebration — also proves canvas-confetti is wired up.
    fireConfetti();
    const next = useAppStore.getState().settings.theme === 'dark' ? 'Dark' : 'Light';
    toast(`${next} mode on`, 'info');
  };

  return (
    <Routes>
      <Route element={<Layout onToggleTheme={handleToggleTheme} />}>
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="focus" element={<FocusPage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
