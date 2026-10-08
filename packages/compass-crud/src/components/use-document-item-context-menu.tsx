import type HadronDocument from 'hadron-document';
import {
  useContextMenuGroups,
  useTranslation,
} from '@mongodb-js/compass-components';

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
  const t = useTranslation();
  const { expanded: isExpanded, editing: isEditing } = doc;

  return useContextMenuGroups(
    () => [
      {
        telemetryLabel: 'Document Expand Collapse',
        items: [
          {
            label: isExpanded
              ? t('crud.contextMenu.collapseAll', 'Collapse all fields')
              : t('crud.contextMenu.expandAll', 'Expand all fields'),
            onAction: () => {
              if (isExpanded) {
                doc.collapse();
              } else {
                doc.expand();
              }
            },
          },
        ],
      },
      {
        telemetryLabel: 'Document Item',
        items: [
          ...(isEditable
            ? [
                {
                  label: isEditing
                    ? t('crud.contextMenu.cancelEditing', 'Cancel editing')
                    : t('crud.contextMenu.editDocument', 'Edit document'),
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
          {
            label: t(
              'crud.contextMenu.copyShell',
              'Copy document as Shell Syntax'
            ),
            onAction: () => {
              copyToClipboard?.(doc, 'shell-syntax');
            },
          },
          {
            label: t('crud.contextMenu.copyEjson', 'Copy document as EJSON'),
            onAction: () => {
              copyToClipboard?.(doc, 'ejson');
            },
          },
          isEditable
            ? {
                label: t('crud.contextMenu.clone', 'Clone document...'),
                onAction: () => {
                  const clonedDoc = doc.generateObject({
                    excludeInternalFields: true,
                  });
                  void openInsertDocumentDialog?.(clonedDoc, true);
                },
              }
            : undefined,
        ],
      },
      isEditable && !isEditing
        ? {
            telemetryLabel: 'Document Item Delete',
            items: [
              {
                label: t('crud.contextMenu.delete', 'Delete document'),
                onAction: () => {
                  doc.markForDeletion();
                },
              },
            ],
          }
        : undefined,
    ],
    [
      doc,
      isExpanded,
      isEditing,
      isEditable,
      copyToClipboard,
      openInsertDocumentDialog,
      t,
    ]
  );
}
