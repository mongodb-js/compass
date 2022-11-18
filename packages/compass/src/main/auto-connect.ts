import type { BrowserWindow } from 'electron';

let autoConnectWindow: BrowserWindow['id'] | undefined = undefined;
const browserWindowsThatHaveDisconnectedAtLeastOnce = new Set<
  BrowserWindow['id']
>();

export function shouldWindowAutoConnect({
  id,
}: Pick<BrowserWindow, 'id'>): boolean {
  // First Window to auto-connect wins.
  autoConnectWindow ??= id;

  // Do not auto-connect in Compass windows other than the primary/first-created one.
  // Do not auto-connect if the window is known to ever have been disconnected explicitly.
  return (
    autoConnectWindow === id &&
    !browserWindowsThatHaveDisconnectedAtLeastOnce.has(id)
  );
}

export function onCompassDisconnect({ id }: Pick<BrowserWindow, 'id'>): void {
  browserWindowsThatHaveDisconnectedAtLeastOnce.add(id);
}
