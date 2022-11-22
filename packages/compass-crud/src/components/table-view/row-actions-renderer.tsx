import React, { useCallback, useMemo } from 'react';
import type { ItemAction } from '@mongodb-js/compass-components';
import { ItemActionGroup } from '@mongodb-js/compass-components';

type RowActionsRendererProps = {
  api?: any;
  value?: any;
  node?: any;
  context?: any;
  data?: any;
  nested?: boolean;
  isEditable: boolean;
  copyToClipboard: (data: any) => void;
};

type RowAction = 'edit' | 'remove' | 'clone' | 'copy';

const RowActionsRenderer: React.FunctionComponent<RowActionsRendererProps> = ({
  context,
  copyToClipboard,
  node,
  data,
  nested,
  value,
  isEditable,
}) => {
  const rowActions: ItemAction<RowAction>[] = useMemo(() => {
    const edit: ItemAction<RowAction> = {
      action: 'edit',
      label: 'Edit Document',
      icon: 'Edit',
    };

    if (nested) {
      return [edit];
    }

    return [
      edit,
      { action: 'copy', label: 'Copy Document', icon: 'Copy' },
      { action: 'clone', label: 'Clone Document', icon: 'Clone' },
      { action: 'remove', label: 'Delete Document', icon: 'Trash' },
    ];
  }, [nested]);

  const onAction = useCallback(
    (action: RowAction) => {
      switch (action) {
        case 'edit':
          context.addFooter(node, data, 'editing');
          break;
        case 'remove':
          context.addFooter(node, data, 'deleting');
          break;
        case 'clone':
          context.handleClone(data);
          break;
        case 'copy':
          copyToClipboard(data.hadronDocument);
          break;
        default:
          break;
      }
    },
    [copyToClipboard, context, data, node]
  );

  if (
    value?.state === 'editing' ||
    value?.state === 'deleting' ||
    !isEditable
  ) {
    return null;
  }

  return (
    <div className="table-view-row-actions">
      <div className="table-view-row-actions-panel">
        <ItemActionGroup<RowAction>
          data-testid="table-view-row-actions"
          actions={rowActions}
          onAction={onAction}
          iconSize="xsmall"
        ></ItemActionGroup>
      </div>
    </div>
  );
};

export default RowActionsRenderer;
