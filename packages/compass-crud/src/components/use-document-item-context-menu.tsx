import type HadronDocument from 'hadron-document';
import { useContextMenuItems } from '@mongodb-js/compass-components';

export interface UseDocumentItemContextMenuProps {
  doc: HadronDocument;
  isEditable: boolean;
  copyToClipboard?: (doc: HadronDocument) => void;
  openInsertDocumentDialog?: (
    doc: Record<string, unknown>,
    cloned: boolean
  ) => void;
}

export function useDocumentItemContextMenu({
  doc,
  isEditable,
  copyToClipboard,
  openInsertDocumentDialog,
}: UseDocumentItemContextMenuProps) {
  return useContextMenuItems([
    {
      label: doc.expanded ? 'Collapse all fields' : 'Expand all fields',
      onAction: () => {
        if (doc.expanded) {
          doc.collapse();
        } else {
          doc.expand();
        }
      },
    },
    ...(isEditable && !doc.editing
      ? [
          {
            label: 'Edit document',
            onAction: () => {
              doc.startEditing();
            },
          },
        ]
      : []),
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
              openInsertDocumentDialog?.(clonedDoc, true);
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
  ]);
}
