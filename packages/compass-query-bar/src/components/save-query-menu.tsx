import React, { useCallback, useMemo } from 'react';
import { DropdownMenuButton, Icon } from '@mongodb-js/compass-components';
import type { MenuAction } from '@mongodb-js/compass-components';
import { connect } from '../stores/context';
import type { RootState } from '../stores/query-bar-store';
import { updateLoadedFavorite } from '../stores/query-bar-reducer';

/**
 * Mode the parent should open `SaveDraftAsFavoriteModal` in. The modal
 * itself is the same component; the mode just decides what name to
 * pre-fill and what flow the user is in conceptually:
 *   - `save`    — first-time save of a brand-new draft.
 *   - `save-as` — save a sibling of the currently-loaded favorite
 *                 (modal pre-fills `<original> (copy)`).
 */
export type SaveModalMode = 'save' | 'save-as';

type SaveQueryMenuAction = 'save' | 'saveAs';

type SaveQueryMenuProps = {
  /** Disable both menu items together (e.g. when the draft is invalid). */
  disabled: boolean;
  /**
   * `null` if the bar isn't editing a loaded favorite — in which case
   * `Save` opens the modal in `save` mode. When set, `Save` fires the
   * in-place update thunk instead.
   */
  loadedFavoriteId: string | null;
  onOpenSaveModal: (mode: SaveModalMode) => void;
  onSaveExisting: () => Promise<boolean>;
};

const SaveQueryMenuComponent: React.FunctionComponent<SaveQueryMenuProps> = ({
  disabled,
  loadedFavoriteId,
  onOpenSaveModal,
  onSaveExisting,
}) => {
  const actions = useMemo<MenuAction<SaveQueryMenuAction>[]>(
    () => [
      { action: 'save', label: 'Save' },
      { action: 'saveAs', label: 'Save as' },
    ],
    []
  );

  const onAction = useCallback(
    (action: SaveQueryMenuAction) => {
      if (action === 'save') {
        if (loadedFavoriteId) {
          // Fire-and-forget; the thunk surfaces failures via the
          // logger. We deliberately don't pop the modal as a fallback
          // because update failures are usually disk-level (the user's
          // next click — for them to know — will just be Save again).
          void onSaveExisting();
        } else {
          onOpenSaveModal('save');
        }
      } else {
        onOpenSaveModal('save-as');
      }
    },
    [loadedFavoriteId, onSaveExisting, onOpenSaveModal]
  );

  return (
    <DropdownMenuButton<SaveQueryMenuAction>
      data-testid="query-bar-save-menu"
      actions={actions}
      onAction={onAction}
      buttonText="Save"
      buttonProps={{
        size: 'small',
        leftGlyph: <Icon glyph="Save" />,
        disabled,
        'data-testid': 'query-bar-save-menu-button',
      }}
    />
  );
};

export const SaveQueryMenu = connect(
  (state: RootState) => ({
    loadedFavoriteId: state.queryBar.loadedFavoriteId,
  }),
  {
    onSaveExisting: updateLoadedFavorite,
  }
)(SaveQueryMenuComponent);
