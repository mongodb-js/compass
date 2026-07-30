import { useEffect } from 'react';
import type { Document as HadronDocument, Element } from 'hadron-document';
import { DocumentEvents, ElementEvents } from 'hadron-document';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

export type DocumentEditsMode = 'list' | 'json' | 'table' | 'insert';

function addedTo(element: Element) {
  return element.parent && element.parent.currentType === 'Array'
    ? 'array'
    : 'document';
}

/**
 * Tracks how the user edits documents by listening to the documents
 * themselves, so that all the editing UIs (list, table and the insert dialog)
 * are covered without them having to know about telemetry.
 */
export function useDocumentEditsTelemetry(
  docs: HadronDocument[],
  mode: DocumentEditsMode
): void {
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();

  useEffect(() => {
    // The JSON view edits documents as text, it has no field editing UI
    const fieldsMode = mode === 'json' ? null : mode;
    // Cancelling an insert is tracked as `Document Insert Cancelled` instead
    const cancelMode = mode === 'insert' ? null : mode;

    const cleanup = docs.map((doc) => {
      // Elements emit `Edited` on every keystroke, so we only report the first
      // edit of a field within an editing session
      const editedElements = new Set<string>();
      // Last known type of an element. Changing the type of a field is also
      // only reported as `Edited`, and is not a value edit.
      const currentTypes = new Map<string, string>();

      const onEdited = (element: Element) => {
        if (!fieldsMode) {
          return;
        }
        const previousType = currentTypes.get(element.uuid) ?? element.type;
        currentTypes.set(element.uuid, element.currentType);

        // TODO(COMPASS-10767): track this as `Document Field Type Changed`
        // once hadron-document emits `Converted` for type changes.
        if (previousType !== element.currentType) {
          return;
        }

        // Editing a field the user just added is already covered by the added
        // event
        if (element.isAdded() || editedElements.has(element.uuid)) {
          return;
        }
        editedElements.add(element.uuid);
        track(
          'Document Field Edited',
          { type: element.currentType, mode: fieldsMode },
          connectionInfoRef.current
        );
      };

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

      const onUpdateSuccess = () => {
        editedElements.clear();
      };

      const onCancel = () => {
        editedElements.clear();
        if (cancelMode) {
          track(
            'Document Update Cancelled',
            { mode: cancelMode },
            connectionInfoRef.current
          );
        }
      };

      doc.on(ElementEvents.Edited, onEdited);
      doc.on(ElementEvents.Added, onAdded);
      doc.on(ElementEvents.Removed, onRemoved);
      doc.on(DocumentEvents.UpdateSuccess, onUpdateSuccess);
      doc.on(DocumentEvents.Cancel, onCancel);

      return () => {
        doc.off(ElementEvents.Edited, onEdited);
        doc.off(ElementEvents.Added, onAdded);
        doc.off(ElementEvents.Removed, onRemoved);
        doc.off(DocumentEvents.UpdateSuccess, onUpdateSuccess);
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
