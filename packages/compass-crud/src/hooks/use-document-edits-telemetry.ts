import { useEffect } from 'react';
import type { Document as HadronDocument, Element } from 'hadron-document';
import type { TypeCastTypes } from 'hadron-type-checker';
import { DocumentEvents, ElementEvents } from 'hadron-document';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

export type DocumentEditsMode = 'list' | 'json' | 'table' | 'insert';

function addedTo(element: Element) {
  const parent = element.parent;
  if (!parent || parent.isRoot()) {
    return 'top_level';
  }
  return parent.currentType === 'Array' ? 'array' : 'document';
}

/**
 * Tracks how the user edits documents, so that various ways of
 * editing (list, table and the insert dialog) can share similar tracking.
 */
export function useDocumentEditsTelemetry(
  docs: HadronDocument[],
  mode: DocumentEditsMode
): void {
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();

  useEffect(() => {
    // The JSON view edits documents as text, it has no field editing UI.
    const fieldsMode = mode === 'json' ? null : mode;
    // Cancelling an insert is tracked separately as `Document Insert Cancelled`.
    const cancelMode = mode === 'insert' ? null : mode;
    // Value edits are only tracked when editing existing documents.
    const editMode = fieldsMode === 'insert' ? null : fieldsMode;

    const cleanup = docs.map((doc) => {
      const onAdded = (element: Element) => {
        if (!fieldsMode) {
          return;
        }
        track(
          'Document Field Added',
          { added_to: addedTo(element), mode: fieldsMode },
          connectionInfoRef.current
        );
      };

      const onRemoved = (element: Element) => {
        if (!fieldsMode) {
          return;
        }
        track(
          'Document Field Removed',
          { type: element.currentType, mode: fieldsMode },
          connectionInfoRef.current
        );
      };

      const onTypeChanged = (element: Element, previousType: TypeCastTypes) => {
        if (!fieldsMode) {
          return;
        }
        track(
          'Document Field Type Changed',
          {
            from_type: previousType,
            to_type: element.currentType,
            mode: fieldsMode,
          },
          connectionInfoRef.current
        );
      };

      const onEditCompleted = (element: Element) => {
        if (!editMode) {
          return;
        }
        track(
          'Document Field Edited',
          { type: element.currentType, mode: editMode },
          connectionInfoRef.current
        );
      };

      const onCancel = () => {
        // The edit actions footer cancels the document when the user backs out
        // of the delete document confirmation, which is not an update.
        if (cancelMode && !doc.markedForDeletion) {
          track(
            'Document Update Cancelled',
            { mode: cancelMode },
            connectionInfoRef.current
          );
        }
      };

      doc.on(ElementEvents.Added, onAdded);
      doc.on(ElementEvents.Removed, onRemoved);
      doc.on(ElementEvents.TypeChanged, onTypeChanged);
      doc.on(ElementEvents.EditCompleted, onEditCompleted);
      doc.on(DocumentEvents.Cancel, onCancel);

      return () => {
        doc.off(ElementEvents.Added, onAdded);
        doc.off(ElementEvents.Removed, onRemoved);
        doc.off(ElementEvents.TypeChanged, onTypeChanged);
        doc.off(ElementEvents.EditCompleted, onEditCompleted);
        doc.off(DocumentEvents.Cancel, onCancel);
      };
    });

    return () => {
      for (const off of cleanup) {
        off();
      }
    };
  }, [docs, mode, track, connectionInfoRef]);
}
