import type { Browser } from 'webdriverio';
import type * as Commands from './commands';

type CommandsType = typeof Commands;

export type CompassBrowser = Browser<'async'> & {
  [key in keyof CommandsType]: CommandsType[key] extends (
    browser: CompassBrowser,
    ...args: infer A
  ) => infer R
    ? (this: CompassBrowser, ...args: A) => R
    : never;
};
