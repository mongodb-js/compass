import type * as Commands from './commands';

type CommandsType = typeof Commands;

export type CompassBrowser = WebdriverIO.Browser & {
  [key in keyof CommandsType]: CommandsType[key] extends (
    browser: CompassBrowser,
    ...args: infer A
  ) => infer R
    ? (this: CompassBrowser, ...args: A) => R
    : never;
};
