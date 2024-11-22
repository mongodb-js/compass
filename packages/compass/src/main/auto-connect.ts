import type { AllPreferences } from 'compass-preferences-model';
import type { BrowserWindow } from 'electron';
import { dialog } from 'electron';
import { hasDisallowedConnectionStringOptions } from './validate-connection-string';
import COMPASS_ICON from './icon';
import { createLogger, mongoLogId } from '@mongodb-js/compass-logging';
import { redactConnectionString } from 'mongodb-connection-string-url';
const { log } = createLogger('COMPASS-AUTO-CONNECT-MAIN');

export type AutoConnectPreferences = Partial<
  Pick<
    AllPreferences,
    | 'file'
    | 'positionalArguments'
    | 'passphrase'
    | 'username'
    | 'password'
    | 'trustedConnectionString'
  >
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

async function hasUserConfirmedConnectionAttempt(
  connectionString: string
): Promise<boolean> {
  log.info(
    mongoLogId(1_001_000_292),
    'validation',
    'Asking for confirmation on whether to automatically connect with connection string',
    {
      connectionString: redactConnectionString(connectionString),
    }
  );
  const answer = await dialog.showMessageBox({
    type: 'info',
    title: 'Connect to a MongoDB deployment',
    icon: COMPASS_ICON,
    message: 'Are you sure that you want to proceed?',
    detail: `This MongoDB connection string contains options that are typically not set by default and may present a security risk. Are you sure that you want to connect to this cluster?\n\n${connectionString}`,
    buttons: ['Connect', 'Cancel'],
    defaultId: 1,
  });
  const positive = answer.response === 0;
  log.info(
    mongoLogId(1_001_000_293),
    'validation',
    'Received confirmation on whether to automatically connect with connection string',
    {
      connectionString: redactConnectionString(connectionString),
      positive,
    }
  );
  return positive;
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

export const getConnectionStringFromArgs = (args?: string[]) => args?.[0];

const shouldPreventAutoConnect = async ({
  connectionString,
  trustedConnectionString,
}: {
  connectionString?: string;
  trustedConnectionString?: boolean;
}) => {
  if (!connectionString) {
    return false;
  }
  const needsConfirm = hasDisallowedConnectionStringOptions(connectionString);
  if (trustedConnectionString || !needsConfirm) return false;

  process.stderr.write(
    `The "${connectionString}" connection string contains options that are typically not set by default and may present a security risk. You are required to confirm this connection attempt. Set --trustedConnectionString to allow connecting to any connection string without confirmation. Do not use this flag if you do not trust the source of the connection string.\n`
  );
  return !(await hasUserConfirmedConnectionAttempt(connectionString));
};

export async function getWindowAutoConnectPreferences(
  bw: Pick<BrowserWindow, 'id'> | undefined | null,
  preferences: {
    getPreferences(): Omit<AutoConnectPreferences, 'shouldAutoConnect'>;
  }
): Promise<AutoConnectPreferences> {
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

  // Do not auto-connect if open-url contains disallowed options
  // and the user canceled such connection attempt.
  if (
    await shouldPreventAutoConnect({
      connectionString: windowState?.url,
    })
  ) {
    return { shouldAutoConnect: false };
  }

  if (windowState?.url) {
    return Promise.resolve({
      positionalArguments: [windowState.url],
      shouldAutoConnect: true,
    });
  }

  const {
    file,
    positionalArguments,
    passphrase,
    username,
    password,
    trustedConnectionString,
  } = preferences.getPreferences();

  // The about: accounts for webdriverio in the e2e tests appending the argument for every run
  if (
    !file &&
    (!positionalArguments?.length ||
      positionalArguments?.every((arg) => arg.startsWith('about:')))
  ) {
    return { shouldAutoConnect: false };
  }

  // Do not auto-connect if the connection string from cli contains disallowed options
  // and the user canceled such connection attempt.
  if (
    !file &&
    (await shouldPreventAutoConnect({
      connectionString: getConnectionStringFromArgs(positionalArguments),
      trustedConnectionString: !!trustedConnectionString,
    }))
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
