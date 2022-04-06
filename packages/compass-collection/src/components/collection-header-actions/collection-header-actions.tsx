import { Button, ButtonSize, css } from '@mongodb-js/compass-components';
import React from 'react';

import ViewInformation from './view-information';

const collectionHeaderActionsStyles = css({
  flexGrow: 2,
  display: 'flex',
  alignItems: 'inherit',
});

const collectionHeaderActionsReadonlyStyles = css({
  margin: '0px 8px',
  marginLeft: 'auto',
  fontSize: '16px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  alignItems: 'inherit',
});

type CollectionHeaderActionsProps = {
  editViewName?: string;
  isReadonly: boolean;
  onEditViewClicked: () => void;
  onReturnToViewClicked: () => void;
  sourceName: string;
};

const CollectionHeaderActions: React.FunctionComponent<CollectionHeaderActionsProps> = ({
  editViewName,
  isReadonly,
  onEditViewClicked,
  onReturnToViewClicked,
  sourceName,
}: CollectionHeaderActionsProps) => {
  return (
    <div className={collectionHeaderActionsStyles} data-testid="collection-header-actions">
      {isReadonly && sourceName && (
        <ViewInformation sourceName={sourceName} />
      )}
      {isReadonly && sourceName && !editViewName && (
        <Button
          data-testid="collection-header-actions-edit-button"
          size={ButtonSize.XSmall}
          onClick={onEditViewClicked}
        >EDIT VIEW</Button>
      )}
      {editViewName && (
        <Button
        data-testid="collection-header-actions-return-to-view-button"
          className={collectionHeaderActionsReadonlyStyles}
          size={ButtonSize.XSmall}
          onClick={onReturnToViewClicked}
        >&lt; Return to View</Button>
      )}
    </div>
  );
}

export default CollectionHeaderActions;
