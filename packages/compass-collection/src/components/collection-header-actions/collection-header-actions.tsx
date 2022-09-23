import {
  Button,
  ButtonSize,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import React from 'react';

import ViewInformation from './view-information';

const editViewButtonStyles = css({
  flex: 'none',
});

const collectionHeaderActionsStyles = css({
  display: 'flex',
  marginLeft: 'auto',
  alignItems: 'center',
  overflow: 'hidden',
  gap: spacing[2],
});

const collectionHeaderActionsReadonlyStyles = css({
  alignItems: 'center',
  flex: 'none',
});

type CollectionHeaderActionsProps = {
  editViewName?: string;
  isReadonly: boolean;
  onEditViewClicked: () => void;
  onReturnToViewClicked: () => void;
  sourceName?: string;
};

const CollectionHeaderActions: React.FunctionComponent<
  CollectionHeaderActionsProps
> = ({
  editViewName,
  isReadonly,
  onEditViewClicked,
  onReturnToViewClicked,
  sourceName,
}: CollectionHeaderActionsProps) => {
  return (
    <div
      className={collectionHeaderActionsStyles}
      data-testid="collection-header-actions"
    >
      {isReadonly && sourceName && <ViewInformation sourceName={sourceName} />}
      {isReadonly && sourceName && !editViewName && (
        <Button
          data-testid="collection-header-actions-edit-button"
          className={editViewButtonStyles}
          size={ButtonSize.XSmall}
          onClick={onEditViewClicked}
        >
          EDIT VIEW
        </Button>
      )}
      {editViewName && (
        <Button
          data-testid="collection-header-actions-return-to-view-button"
          className={collectionHeaderActionsReadonlyStyles}
          size={ButtonSize.XSmall}
          onClick={onReturnToViewClicked}
        >
          &lt; Return to View
        </Button>
      )}
    </div>
  );
};

export default CollectionHeaderActions;
