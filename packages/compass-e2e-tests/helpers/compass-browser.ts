import type { Browser } from 'webdriverio';
import * as Commands from './commands';

type CommandsType = typeof Commands;

export type CompassBrowser = Browser<'async'> &
  {
    [key in keyof CommandsType]: CommandsType[key] extends (
      browser: Browser<'async'>,
      ...args: infer A
    ) => infer R
      ? (this: Browser<'async'>, ...args: A) => R
      : never;
  };