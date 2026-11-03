import type { ContextBridge } from 'electron';

export type CompassAppInfo = {
  name: string;
  version: string;
  userDataPath: string;
};

declare global {
  interface Window {
    compassApp?: CompassAppInfo;
  }
}

const APP_INFO_ARGUMENT = '--compass-app-info=';

// Passed through webPreferences.additionalArguments rather than IPC so the
// preload can read it synchronously, which also works once it is sandboxed.
export function appInfoArgument(info: CompassAppInfo): string {
  return `${APP_INFO_ARGUMENT}${JSON.stringify(info)}`;
}

export function exposeAppInfo(
  target: Window,
  argv: readonly string[],
  contextBridge: Pick<ContextBridge, 'exposeInMainWorld'>,
  contextIsolated: boolean
): void {
  const argument = argv.find((arg) => arg.startsWith(APP_INFO_ARGUMENT));
  if (!argument) {
    throw new Error(`Missing ${APP_INFO_ARGUMENT} preload argument`);
  }
  const info = JSON.parse(
    argument.slice(APP_INFO_ARGUMENT.length)
  ) as CompassAppInfo;
  if (contextIsolated) {
    contextBridge.exposeInMainWorld('compassApp', info);
  } else {
    // exposeInMainWorld throws without context isolation, and then the
    // preload shares the page's window anyway
    Object.assign(target, { compassApp: info });
  }
}
