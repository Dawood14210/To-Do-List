import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Database,
  Download,
  HardDriveDownload,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import { useAppStore } from '../store';
import { useToast } from '../hooks/useToast';
import { cn } from '../utils/cn';
import {
  backupFilename,
  exportBackup,
  listLocalBackups,
  readLocalBackup,
  type LocalBackup,
} from '../utils/fileTransfer';
import { hapticMedium, isNative } from '../utils/native';
import { formatDuration } from '../utils/focus';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalModal } from '../components/BrutalModal';
import { Sticker } from '../components/Sticker';

/**
 * Read a picked file as text. Uses FileReader (works in older Safari/jsdom)
 * and falls back to the newer Blob.text() when FileReader is missing.
 */
function readFileText(file: File): Promise<string> {
  if (typeof FileReader === 'undefined') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsText(file);
  });
}

/**
 * Settings: theme, JSON export / import and a confirmed reset of everything.
 * Data lives in `localStorage` under the store's persist key.
 */
export default function SettingsPage() {
  const theme = useAppStore((state) => state.settings.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const tasks = useAppStore((state) => state.tasks);
  const categories = useAppStore((state) => state.categories);
  const habits = useAppStore((state) => state.habits);
  const notes = useAppStore((state) => state.notes);
  const focusSessions = useAppStore((state) => state.focusSessions);
  const exportData = useAppStore((state) => state.exportData);
  const importData = useAppStore((state) => state.importData);
  const resetData = useAppStore((state) => state.resetData);
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingReset, setPendingReset] = useState(false);
  const [localBackups, setLocalBackups] = useState<LocalBackup[]>([]);

  const focusMinutes = focusSessions.reduce((sum, session) => sum + session.minutes, 0);
  const fileSize = useMemo(() => {
    const bytes = new Blob([exportData()]).size;
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  }, [exportData, tasks, categories, habits, notes, focusSessions]);

  // On the device, exports are written to the app folder — list them so they
  // can be restored without leaving the app.
  const refreshLocalBackups = useCallback(() => {
    if (!isNative()) return;
    void listLocalBackups()
      .then(setLocalBackups)
      .catch(() => setLocalBackups([]));
  }, []);

  useEffect(() => {
    refreshLocalBackups();
  }, [refreshLocalBackups]);

  const counts = [
    { label: 'Tasks', value: tasks.length, color: 'bg-pink' },
    { label: 'Categories', value: categories.length, color: 'bg-orange' },
    { label: 'Habits', value: habits.length, color: 'bg-mint' },
    { label: 'Notes', value: notes.length, color: 'bg-cream' },
    { label: 'Focus sessions', value: focusSessions.length, color: 'bg-blue' },
    { label: 'Focused', value: formatDuration(focusMinutes), color: 'bg-yellow' },
  ];

  /**
   * Export: on Android the JSON is written with the Filesystem plugin and
   * handed to the system share sheet; on the web it is a normal download.
   */
  const handleExport = async () => {
    const result = await exportBackup(exportData(), backupFilename());
    toast(result.message, result.ok ? 'success' : 'error');
    if (result.ok) refreshLocalBackups();
  };

  /** Restore one of the backups already on the device (native import path). */
  const handleRestoreLocal = async (backup: LocalBackup) => {
    let text = '';
    try {
      text = await readLocalBackup(backup.name);
    } catch {
      toast('Could not read that backup', 'error');
      return;
    }
    const result = importData(text);
    if (!result.ok || !result.counts) {
      toast(result.error ?? 'Import failed', 'error');
      return;
    }
    const { tasks: t, categories: c, habits: h, notes: n, focusSessions: f } = result.counts;
    toast(`Restored ${backup.name} — ${t} tasks, ${c} categories, ${h} habits, ${n} notes, ${f} sessions`, 'success');
  };

  const handleFile = async (file: File) => {
    let text = '';
    try {
      text = await readFileText(file);
    } catch {
      toast('Could not read that file', 'error');
      return;
    }

    const result = importData(text);
    if (!result.ok || !result.counts) {
      toast(result.error ?? 'Import failed', 'error');
      return;
    }
    const { tasks: t, categories: c, habits: h, notes: n, focusSessions: f } = result.counts;
    toast(
      `Imported ${t} tasks, ${c} categories, ${h} habits, ${n} notes and ${f} sessions`,
      'success'
    );
  };

  const confirmReset = () => {
    void hapticMedium(); // you just deleted everything: feel it
    resetData();
    setPendingReset(false);
    toast('All data reset to a fresh start', 'warning');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl uppercase leading-none sm:text-4xl">Settings</h1>
          <Sticker color="yellow" rotate={-3}>
            {theme === 'dark' ? 'Dark' : 'Light'} mode
          </Sticker>
        </div>
        <p className="max-w-sm font-mono text-[10px] uppercase leading-snug tracking-wider opacity-70">
          Everything is stored locally in your browser — no account, no server.
        </p>
      </div>

      {/* Appearance */}
      <section
        aria-label="Appearance"
        className="rounded-md border bg-white p-4 text-ink shadow-brutal dark:bg-black dark:text-white dark:shadow-brutal-invert sm:p-5"
      >
        <h2 className="text-xl uppercase leading-none">Appearance</h2>

        <div role="group" aria-label="Colour theme" className="mt-4 flex flex-wrap gap-3">
          {(['light', 'dark'] as const).map((option) => {
            const active = theme === option;
            const Icon = option === 'light' ? Sun : Moon;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(option)}
                className={cn(
                  'inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-md border px-4 font-heading text-sm uppercase tracking-wide transition-transform duration-100',
                  active
                    ? cn(
                        '-translate-y-0.5 text-ink shadow-brutal-sm dark:shadow-brutal-sm-invert',
                        option === 'light' ? 'bg-yellow' : 'bg-blue'
                      )
                    : 'bg-cream text-ink opacity-70 hoverable:opacity-100 dark:bg-black dark:text-white'
                )}
              >
                <Icon aria-hidden="true" size={22} strokeWidth={2.5} />
                {option === 'light' ? 'Light' : 'Dark'}
              </button>
            );
          })}
        </div>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider opacity-70">
          The header’s sun/moon button does the same thing (with confetti).
        </p>
      </section>

      {/* Data */}
      <section
        aria-label="Your data"
        className="rounded-md border bg-white p-4 text-ink shadow-brutal dark:bg-black dark:text-white dark:shadow-brutal-invert sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl uppercase leading-none">
            <span className="grid h-10 w-10 place-items-center rounded-md border bg-mint text-ink shadow-brutal-sm">
              <Database aria-hidden="true" size={20} strokeWidth={3} />
            </span>
            Your data
          </h2>
          <Sticker color="blue" rotate={-2} small>
            {fileSize} as JSON
          </Sticker>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {counts.map((count) => (
            <li
              key={count.label}
              className="rounded-md border bg-cream p-2 dark:bg-black"
            >
              <span
                aria-hidden="true"
                className={cn('mb-1 block h-2 w-8 rounded-sm border border-black dark:border-white', count.color)}
              />
              <span className="block font-heading text-2xl leading-none tabular-nums">
                {count.value}
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-70">
                {count.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <BrutalButton variant="mint" onClick={() => void handleExport()}>
            <Download aria-hidden="true" size={18} strokeWidth={3} />
            Export JSON
          </BrutalButton>

          <BrutalButton variant="blue" onClick={() => fileInputRef.current?.click()}>
            <Upload aria-hidden="true" size={18} strokeWidth={3} />
            Import JSON
          </BrutalButton>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Choose a JSON backup to import"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) await handleFile(file);
              event.target.value = '';
            }}
          />
        </div>

        <p className="mt-3 font-mono text-[10px] uppercase leading-snug tracking-wider opacity-70">
          {isNative()
            ? 'Stores settings, tasks, categories, habits, notes and focus sessions. Export writes to the app folder and opens the Android share sheet; import opens the file picker. Importing replaces everything currently here.'
            : 'Stores settings, tasks, categories, habits, notes and focus sessions. Importing replaces everything currently here.'}
        </p>

        {localBackups.length > 0 && (
          <div className="mt-4 rounded-md border bg-cream p-3 dark:bg-black">
            <h3 className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider">
              <HardDriveDownload aria-hidden="true" size={16} strokeWidth={3} />
              Backups on this device
            </h3>
            <ul className="mt-2 space-y-2">
              {localBackups.slice(0, 3).map((backup) => (
                <li
                  key={backup.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-white px-2 py-2 dark:bg-black"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[11px] font-bold">{backup.name}</span>
                    <span className="block font-mono text-[10px] uppercase tracking-wider opacity-70">
                      {new Date(backup.mtime).toLocaleString()} · {(backup.size / 1024).toFixed(1)} KB
                    </span>
                  </span>
                  <BrutalButton
                    variant="white"
                    size="sm"
                    onClick={() => void handleRestoreLocal(backup)}
                    aria-label={`Restore ${backup.name}`}
                  >
                    Restore
                  </BrutalButton>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section
        aria-label="Reset data"
        className="rounded-md border-2 border-red bg-white p-4 text-ink shadow-brutal dark:bg-black dark:text-white dark:shadow-brutal-invert sm:p-5"
      >
        <h2 className="flex items-center gap-2 text-xl uppercase leading-none text-red">
          <TriangleAlert aria-hidden="true" size={24} strokeWidth={3} />
          Danger zone
        </h2>

        <p className="mt-3 font-body text-sm leading-relaxed opacity-80">
          Reset puts the app back to a fresh install: the sample tasks, categories and habits come
          back, and your notes and focus history are cleared. Your theme stays as it is.
        </p>

        <BrutalButton variant="pink" className="mt-4" onClick={() => setPendingReset(true)}>
          <Trash2 aria-hidden="true" size={18} strokeWidth={3} />
          Reset all data
        </BrutalButton>
      </section>

      {/* Reset confirmation */}
      <BrutalModal
        open={pendingReset}
        onClose={() => setPendingReset(false)}
        title="Reset all data"
        footer={
          <>
            <BrutalButton variant="white" onClick={() => setPendingReset(false)}>
              Cancel
            </BrutalButton>
            <BrutalButton variant="pink" onClick={confirmReset}>
              <RotateCcw aria-hidden="true" size={18} strokeWidth={3} />
              Yes, reset everything
            </BrutalButton>
          </>
        }
      >
        <div className="space-y-3">
          <p className="font-body text-base leading-relaxed">
            This wipes your data and restores the sample content. It cannot be undone.
          </p>

          <ul className="space-y-2 rounded-md border bg-white p-3 font-body text-sm leading-relaxed dark:bg-black">
            <li>• {tasks.length} tasks → back to the 5 seeded samples</li>
            <li>• {notes.length} notes and {focusSessions.length} focus sessions → cleared</li>
            <li>• {habits.length} habits → back to the 2 seeded samples</li>
            <li>• {categories.length} categories → back to Study / Personal / Health</li>
          </ul>

          <p className="font-mono text-[10px] uppercase tracking-wider opacity-70">
            Tip: export a JSON backup first — it only takes a second.
          </p>
        </div>
      </BrutalModal>
    </div>
  );
}
