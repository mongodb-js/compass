import type { CompassBrowser } from '../compass-browser';

export async function closeShell(
  browser: CompassBrowser,
  connectionName: string
): Promise<void> {
  await browser.closeWorkspaceTab({
    connectionName,
    type: 'Shell',
  });
}
