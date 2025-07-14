import type HadronDocument from 'hadron-document';
import { useContextMenuGroups } from '@mongodb-js/compass-components';

import type { DocumentProps } from './document';

export type UseDocumentItemContextMenuProps = {
  doc: HadronDocument;
  isEditable: boolean;
} & Pick<DocumentProps, 'copyToClipboard' | 'openInsertDocumentDialog'>;

export function useDocumentItemContextMenu({
  doc,
  isEditable,
  copyToClipboard,
  openInsertDocumentDialog,
}: UseDocumentItemContextMenuProps) {
  const { expanded: isExpanded, editing: isEditing } = doc;
  return useContextMenuGroups(
    () => [
      [
        ...(isEditable
          ? [
              {
                label: isEditing ? 'Cancel editing' : 'Edit document',
                onAction: () => {
                  if (isEditing) {
                    doc.finishEditing();
                  } else {
                    doc.startEditing();
                  }
                },
              },
            ]
          : []),
      ],
      [
        {
          label: isExpanded ? 'Collapse all fields' : 'Expand all fields',
          onAction: () => {
            if (isExpanded) {
              doc.collapse();
            } else {
              doc.expand();
            }
          },
        },
        {
          label: 'Copy document',
          onAction: () => {
            copyToClipboard?.(doc);
          },
        },
        ...(isEditable
          ? [
              {
                label: 'Clone document...',
                onAction: () => {
                  const clonedDoc = doc.generateObject({
                    excludeInternalFields: true,
                  });
                  void openInsertDocumentDialog?.(clonedDoc, true);
                },
              },
              {
                label: 'Delete document',
                onAction: () => {
                  doc.markForDeletion();
                },
              },
            ]
          : []),
      ],
    ],
    [
      doc,
      isExpanded,
      isEditing,
      isEditable,
      copyToClipboard,
      openInsertDocumentDialog,
    ]
  );
}
