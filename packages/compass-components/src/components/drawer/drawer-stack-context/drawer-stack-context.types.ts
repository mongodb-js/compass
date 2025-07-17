export interface DrawerStackContextType {
  /**
   * Returns the index of a drawer instance in the drawer stack
   * @param id - The id of the drawer instance to get the index of
   * @returns The index of the drawer instance in the stack
   */
  getDrawerIndex: (id: string) => number;

  /**
   * Registers a drawer instance in the drawer stack
   * @param id - The id of the drawer instance to register
   * @returns void
   */
  registerDrawer: (id: string) => void;

  /**
   * Unregisters a drawer instance from the drawer stack
   * @param id - The id of the drawer instance to unregister
   * @returns void
   */
  unregisterDrawer: (id: string) => void;
}
