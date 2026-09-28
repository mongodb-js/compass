import type { Shell } from 'electron';

/**
 * `shell` comes from the preload script rather than `require('electron')`,
 * which is unavailable in the renderer once `nodeIntegration` is off.
 */
function getShell(): Shell | undefined {
  return (
    globalThis as typeof globalThis & {
      __COMPASS_ELECTRON__?: { shell: Shell };
    }
  ).__COMPASS_ELECTRON__?.shell;
}

export async function openFile(fileName: string): Promise<string> {
  const shell = getShell();
  if (!shell) {
    throw new Error('Cannot open files outside of the Compass desktop app');
  }
  return shell.openPath(fileName);
}
