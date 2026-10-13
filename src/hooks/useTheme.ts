import { useEffect } from 'react';
import { useAppStore } from '../store';

/**
 * Reads the persisted theme, mirrors it onto <html> as the `dark` class
 * (Tailwind `darkMode: 'class'`) and exposes a toggle.
 */
export function useTheme() {
  const theme = useAppStore((state) => state.settings.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  return { theme, isDark: theme === 'dark', toggleTheme };
}
