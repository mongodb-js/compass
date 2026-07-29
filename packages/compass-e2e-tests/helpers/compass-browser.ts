import type * as Commands from './commands/index.ts';
import type * as ElementCommands from './element-commands/index.ts';
import type { Pages } from '../pages/index.ts';

type CommandsType = typeof Commands;
type ElementCommandsType = typeof ElementCommands;

type ElementAugmentations = {
  [key in keyof ElementCommandsType]: ElementCommandsType[key] extends (
    element: WebdriverIO.Element,
    ...args: infer A
  ) => infer R
    ? (...args: A) => R
    : never;
};

declare global {
  // WDIO declares its own types as `declare global { namespace WebdriverIO }`,
  // so re-opening the namespace is the only way to declaration-merge into
  // `WebdriverIO.Element`. Disable is permanent.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace WebdriverIO {
    // Body is intentionally empty: methods come from `extends
    // ElementAugmentations` (mapped over `typeof ElementCommands`). A named,
    // body-less interface declaration is required for declaration merging —
    // mapped types can't be merged into a namespace directly. Disable is
    // permanent even after ElementCommands gains entries.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Element extends ElementAugmentations {}
  }
}

export type CompassBrowser = WebdriverIO.Browser & {
  pages: Pages;
} & {
  [key in keyof CommandsType]: CommandsType[key] extends (
    browser: CompassBrowser,
    ...args: infer A
  ) => infer R
    ? (this: CompassBrowser, ...args: A) => R
    : never;
};
