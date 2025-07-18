import type { DarkModeProps } from '@leafygreen-ui/lib';

import type { GetLgIdsReturnType } from '../utils';

export type ToolbarProviderProps = DarkModeProps & {
  /**
   * The index of the currently focused item in the toolbar.
   */
  focusedIndex?: number;

  /**
   * Whether the toolbar should focus the currently focused item. This will prevent this component from hijacking focus on initial page load.
   */
  shouldFocus?: boolean;

  /**
   * LGIDs for Toolbar components.
   */
  lgIds: GetLgIdsReturnType;

  /**
   * Callback to handle clicks on ToolbarIconButtons.
   */
  handleOnIconButtonClick: (
    event: React.MouseEvent<HTMLButtonElement>,
    focusedIndex: number,
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  ) => void;
};
