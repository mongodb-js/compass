import type { AllPreferences } from 'compass-preferences-model';
import preferences from 'compass-preferences-model';
import type { BrowserWindow } from 'electron';

export type AutoConnectPreferences = Pick<
  AllPreferences,
  'file' | 'positionalArguments' | 'passphrase' | 'username' | 'password'
> & { shouldAutoConnect: boolean };

let autoConnectWindow: BrowserWindow['id'] | undefined = undefined;
const browserWindowStates = new Map<
  BrowserWindow['id'],
  { url?: string; disconnected?: boolean }
>();

export function resetForTesting(): void {
  autoConnectWindow = undefined;
  browserWindowStates.clear();
}

export function registerMongoDbUrlForBrowserWindow(
  bw: Pick<BrowserWindow, 'id'> | undefined | null,
  url: string
): void {
  if (!bw) {
    return;
  }
  browserWindowStates.set(bw.id, { url });
}

export function getWindowAutoConnectPreferences(
  bw: Pick<BrowserWindow, 'id'> | undefined | null
): AutoConnectPreferences {
  if (!bw) {
    return { shouldAutoConnect: false };
  }

  const { id } = bw;

  // First Window to auto-connect wins.
  autoConnectWindow ??= id;

  const windowState = browserWindowStates.get(id);

  // Do not auto-connect in Compass windows other than the primary/first-created one.
  // Do auto-connect if this is a new window on macos that has been opened via open-url.
  if (autoConnectWindow !== id && !windowState?.url) {
    return { shouldAutoConnect: false };
  }

  // Do not auto-connect if the window is known to ever have been disconnected explicitly.
  if (windowState?.disconnected) {
    return { shouldAutoConnect: false };
  }

  if (windowState?.url) {
    return { positionalArguments: [windowState.url], shouldAutoConnect: true };
  }

  const { file, positionalArguments, passphrase, username, password } =
    preferences.getPreferences();

  // The about: accounts for webdriverio in the e2e tests appending the argument for every run
  if (
    !file &&
    (!positionalArguments?.length ||
      positionalArguments?.every((arg) => arg.startsWith('about:')))
  ) {
    return { shouldAutoConnect: false };
  }

  return {
    file,
    positionalArguments,
    passphrase,
    username,
    password,
    shouldAutoConnect: true,
  };
}

export function onCompassDisconnect(
  bw: Pick<BrowserWindow, 'id'> | undefined | null
): void {
  if (!bw) {
    return;
  }
  browserWindowStates.set(bw.id, { disconnected: true });
}
