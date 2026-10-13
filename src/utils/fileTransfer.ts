import { toISODate } from './dates';
import { isNative } from './native';

/**
 * Getting the JSON backup in and out of the device.
 *
 * Native (Android): the file is written with the Filesystem plugin and handed
 * to the system share sheet, so it can go to Drive, Gmail, Files, anywhere.
 * Backups stay listed in the app's own folder and can be restored later
 * without leaving the app.
 *
 * Web: the classic anchor download / file picker, exactly as before.
 */

export const BACKUP_PREFIX = 'to-do-list-backup-';

export function backupFilename(date: Date = new Date()): string {
  return `${BACKUP_PREFIX}${toISODate(date)}.json`;
}

export interface ExportResult {
  ok: boolean;
  filename: string;
  message: string;
}

export interface LocalBackup {
  name: string;
  uri: string;
  /** Last modified, epoch ms. */
  mtime: number;
  size: number;
}

/* ------------------------------------------------------------------ */
/* Web fallback                                                        */
/* ------------------------------------------------------------------ */

/** Anchor download — the web path (and the native fallback if all else fails). */
export function downloadInBrowser(json: string, filename: string): boolean {
  try {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export async function exportBackup(
  json: string,
  filename: string = backupFilename()
): Promise<ExportResult> {
  if (!isNative()) {
    const ok = downloadInBrowser(json, filename);
    return {
      ok,
      filename,
      message: ok
        ? `Exported ${filename} (${(json.length / 1024).toFixed(1)} KB)`
        : 'Download blocked — your browser refused the file',
    };
  }

  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    // App-specific external storage: always writable, no runtime permission.
    let written;
    try {
      written = await Filesystem.writeFile({
        path: filename,
        data: json,
        directory: Directory.External,
        encoding: Encoding.UTF8,
        recursive: true,
      });
    } catch {
      written = await Filesystem.writeFile({
        path: filename,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
        recursive: true,
      });
    }

    try {
      const { Share } = await import('@capacitor/share');
      const { value: canShare } = await Share.canShare();
      if (canShare) {
        await Share.share({
          title: 'BrutalTodo backup',
          text: `BrutalTodo backup — ${filename}`,
          files: [written.uri],
          dialogTitle: 'Save or send your backup',
        });
      }
    } catch {
      /* the user dismissed the share sheet — the file is already written */
    }

    return {
      ok: true,
      filename,
      message: `Exported ${filename} (${(json.length / 1024).toFixed(1)} KB)`,
    };
  } catch {
    // Last resort: try the browser download inside the WebView.
    const ok = downloadInBrowser(json, filename);
    return {
      ok,
      filename,
      message: ok ? `Exported ${filename}` : 'Could not write the backup file',
    };
  }
}

/* ------------------------------------------------------------------ */
/* Native backups on disk                                              */
/* ------------------------------------------------------------------ */

async function listDirectory(directory: 'EXTERNAL' | 'CACHE'): Promise<LocalBackup[]> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const target = directory === 'EXTERNAL' ? Directory.External : Directory.Cache;
  const result = await Filesystem.readdir({ path: '', directory: target });
  return result.files
    .filter((file) => file.type === 'file' && file.name.startsWith(BACKUP_PREFIX))
    .map((file) => ({ name: file.name, uri: file.uri, mtime: file.mtime, size: file.size }))
    .sort((a, b) => b.mtime - a.mtime);
}

/**
 * Backups this device has written, newest first. Empty on the web.
 */
export async function listLocalBackups(): Promise<LocalBackup[]> {
  if (!isNative()) return [];
  try {
    const external = await listDirectory('EXTERNAL');
    if (external.length) return external;
  } catch {
    /* fall through to the cache directory */
  }
  try {
    return await listDirectory('CACHE');
  } catch {
    return [];
  }
}

/**
 * Read one of the app's own backups back in (the native import path).
 */
export async function readLocalBackup(name: string): Promise<string> {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  try {
    const result = await Filesystem.readFile({
      path: name,
      directory: Directory.External,
      encoding: Encoding.UTF8,
    });
    return String(result.data);
  } catch {
    const result = await Filesystem.readFile({
      path: name,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    return String(result.data);
  }
}
