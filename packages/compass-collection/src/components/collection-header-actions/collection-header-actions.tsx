import {
  Button,
  ButtonSize,
  Icon,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import React from 'react';

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
  namespace: string;
  isReadonly: boolean;
  editViewName?: string;
  sourceName?: string;
  sourcePipeline?: unknown[];
};

const CollectionHeaderActions: React.FunctionComponent<
  CollectionHeaderActionsProps
> = ({
  namespace,
  isReadonly,
  editViewName,
  sourceName,
  sourcePipeline,
}: CollectionHeaderActionsProps) => {
  const { openCollectionWorkspace, openEditViewWorkspace } = useOpenWorkspace();
  return (
    <div
      className={collectionHeaderActionsStyles}
      data-testid="collection-header-actions"
    >
      {isReadonly && sourceName && !editViewName && (
        <Button
          data-testid="collection-header-actions-edit-button"
          className={editViewButtonStyles}
          size={ButtonSize.Small}
          onClick={() => {
            if (sourceName && sourcePipeline) {
              openEditViewWorkspace(namespace, {
                sourceName,
                sourcePipeline,
              });
            }
          }}
        >
          <Icon glyph="Edit" />
          Edit Pipeline
        </Button>
      )}
      {editViewName && (
        <Button
          data-testid="collection-header-actions-return-to-view-button"
          className={collectionHeaderActionsReadonlyStyles}
          size={ButtonSize.Small}
          onClick={() => {
            if (editViewName) {
              openCollectionWorkspace(editViewName);
            }
          }}
        >
          <Icon glyph="ArrowLeft" />
          Return to View
        </Button>
      )}
    </div>
  );
};

export default CollectionHeaderActions;
