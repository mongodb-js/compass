// Type-only import in a separate entry point, so this is fine
// compass-peer-deps-ignore
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { MenuItemConstructorOptions } from 'electron';

export type { MenuItemConstructorOptions };
export type CompassAppMenu<ClickHandlerType = () => void> = Omit<
  MenuItemConstructorOptions,
  'click' | 'submenu'
> & { click?: ClickHandlerType; submenu?: CompassAppMenu<ClickHandlerType>[] };
export type UUIDString = string;

// Shared helper that is useful in a few places since we need to
// translate between 'real function' click handlers and
// string identifiers for those click handlers in a few places.
export function transformAppMenu<T, U>(
  menu: CompassAppMenu<T>,
  transform: (
    cb: Omit<CompassAppMenu<T>, 'submenu'>
  ) => Omit<CompassAppMenu<U>, 'submenu'>
): CompassAppMenu<U> {
  return {
    ...transform({ ...menu }),
    ...(menu.submenu
      ? {
          submenu: menu.submenu.map((sub) => transformAppMenu(sub, transform)),
        }
      : undefined),
  };
}

export interface ModifyApplicationMenuParams {
  id: string;
  menu?: CompassAppMenu<UUIDString>;
  role?: MenuItemConstructorOptions['role'];
}

export interface IpcEvents {
  'application-menu:modify-application-menu': ModifyApplicationMenuParams;
  'application-menu:invoke-handler': { id: string };
}
