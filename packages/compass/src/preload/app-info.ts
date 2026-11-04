import type { ContextBridge } from 'electron';

export type CompassAppInfo = {
  userDataPath: string;
};

declare global {
  interface Window {
    compassApp?: CompassAppInfo;
  }
}

const USER_DATA_PATH_ARGUMENT = '--compass-user-data-path=';

// The path is only known at runtime, so main passes it through
// webPreferences.additionalArguments, which the preload can read synchronously
// and which still works once it is sandboxed.
export function userDataPathArgument(userDataPath: string): string {
  return `${USER_DATA_PATH_ARGUMENT}${userDataPath}`;
}

export function exposeAppInfo(
  target: Window,
  argv: readonly string[],
  contextBridge: Pick<ContextBridge, 'exposeInMainWorld'>,
  contextIsolated: boolean
): void {
  const argument = argv.find((arg) => arg.startsWith(USER_DATA_PATH_ARGUMENT));
  if (!argument) {
    throw new Error(`Missing ${USER_DATA_PATH_ARGUMENT} preload argument`);
  }
  const info: CompassAppInfo = {
    userDataPath: argument.slice(USER_DATA_PATH_ARGUMENT.length),
  };
  if (contextIsolated) {
    contextBridge.exposeInMainWorld('compassApp', info);
  } else {
    // exposeInMainWorld throws without context isolation, and then the
    // preload shares the page's window anyway
    Object.assign(target, { compassApp: info });
  }
}
