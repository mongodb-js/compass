import type { LayoutData } from '../drawer-toolbar-layout';

export type ContextData = LayoutData | undefined;

export type DataId = LayoutData['id'];

export interface DrawerToolbarContextType {
  /**
   * This function is used to open the drawer with the given data.
   * @param id - The id of the drawer to open
   * @returns void
   */
  openDrawer: (id: DataId) => void;

  /**
   * This function is used to clear the active drawer data and indicates that the drawer should close.
   * @returns void
   */
  closeDrawer: () => void;

  /**
   * Indicates whether the drawer should be closed. Used to manage transition states.
   * For example, during close animations, content should remain until the transition completes.
   */
  isDrawerOpen: boolean;

  /**
   * This function is used to get the active drawer content.
   * @returns The active drawer data
   */
  getActiveDrawerContent: () => ContextData;
}

export interface DrawerToolbarProviderProps {
  /**
   * The children of the provider
   */
  children: React.ReactNode;

  /**
   * The data to be used in the drawer
   */
  data: Array<ContextData>;
}
