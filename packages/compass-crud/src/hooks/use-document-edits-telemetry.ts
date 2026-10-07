import { useEffect, useRef } from 'react';
import { isEqual } from 'lodash';
import type { Document as HadronDocument, Element } from 'hadron-document';
import { DocumentEvents, ElementEvents } from 'hadron-document';
import TypeChecker from 'hadron-type-checker';
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

// Editors for types like Date or ObjectId hold the text being typed in
// `currentValue` and emit edits on focus and blur as they convert between the
// text and the value, so we compare values as the field's type.
function comparableValue(element: Element): unknown {
  const { currentValue, currentType } = element;
  if (
    typeof currentValue !== 'string' ||
    currentType === 'String' ||
    !element.isCurrentTypeValid()
  ) {
    return currentValue;
  }
  try {
    return TypeChecker.cast(currentValue, currentType);
  } catch {
    return currentValue;
  }
}

// Editors emit on every keystroke, we track one edit/rename per field.
type TrackedField = {
  edited?: boolean;
  renamed?: boolean;
  lastType: string;
  lastKey: string | number;
  lastValue: unknown;
};

type TrackDocumentEditsOptions = {
  fields: Map<Element, TrackedField>;
  mode: DocumentEditsMode;
  track: ReturnType<typeof useTelemetry>;
  connectionInfoRef: ReturnType<typeof useConnectionInfoRef>;
};

function trackDocumentEdits(
  doc: HadronDocument,
  { fields, mode, track, connectionInfoRef }: TrackDocumentEditsOptions
): () => void {
  // The JSON view edits documents as text, it has no field editing UI.
  const fieldsMode = mode === 'json' ? null : mode;
  // Cancelling an insert is tracked separately as `Document Insert Cancelled`.
  const cancelMode = mode === 'insert' ? null : mode;
  // Every field of an inserted document is edited by definition, so neither
  // edits nor renames are tracked there, only `Document Field Added`.
  const editMode = fieldsMode === 'insert' ? null : fieldsMode;

  const pending = new Set<Element>();
  let disposed = false;

  const forget = (element: Element) => {
    fields.delete(element);
    pending.delete(element);
  };

  const forgetAll = () => {
    fields.clear();
    pending.clear();
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

  // `Element.changeType` can emit two edits for one user action, first with
  // an intermediate type and then with the final one, so we only look at
  // the state a field ends a tick in rather than at every event.
  const onEdited = (element: Element) => {
    if (pending.has(element)) {
      return;
    }
    pending.add(element);
    queueMicrotask(() => {
      if (!pending.delete(element) || disposed) {
        return;
      }
      trackFieldChange(element);
    });
  };

  const trackFieldChange = (element: Element) => {
    const field = fields.get(element) ?? {
      lastKey: element.key,
      lastType: element.type,
      lastValue: element.value,
    };
    fields.set(element, field);

    const fromKey = field.lastKey;
    const toKey = element.currentKey;
    field.lastKey = toKey;

    const fromType = field.lastType;
    const toType = element.currentType;
    field.lastType = toType;

    const fromValue = field.lastValue;
    const toValue = comparableValue(element);
    field.lastValue = toValue;

    // `Element.rename` emits an edit without touching the value. Array keys
    // are indices, which shift silently as elements are added before them.
    if (fromKey !== toKey && element.parent?.currentType !== 'Array') {
      if (editMode && !element.isAdded() && !field.renamed) {
        field.renamed = true;
        track(
          'Document Field Renamed',
          { type: toType, mode: editMode },
          connectionInfoRef.current
        );
      }
      return;
    }

    if (fromType !== toType) {
      if (fieldsMode) {
        track(
          'Document Field Type Changed',
          {
            from_type: fromType,
            to_type: toType,
            value_invalid: !element.isCurrentTypeValid(),
            mode: fieldsMode,
          },
          connectionInfoRef.current
        );
      }
      return;
    }

    if (
      !editMode ||
      field.edited ||
      element.isAdded() ||
      isEqual(fromValue, toValue)
    ) {
      return;
    }
    field.edited = true;
    track(
      'Document Field Edited',
      { type: toType, mode: editMode },
      connectionInfoRef.current
    );
  };

  const onRemoved = (element: Element) => {
    forget(element);
    if (!fieldsMode) {
      return;
    }
    track(
      'Document Field Removed',
      { type: element.currentType, mode: fieldsMode },
      connectionInfoRef.current
    );
  };

  const onCancel = () => {
    forgetAll();
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
  doc.on(ElementEvents.Edited, onEdited);
  // Changing to a type the value can't be converted to, or typing a value
  // that isn't valid for the type, emits `Invalid` instead of `Edited`.
  doc.on(ElementEvents.Invalid, onEdited);
  doc.on(ElementEvents.Reverted, forget);
  doc.on(ElementEvents.Removed, onRemoved);
  doc.on(DocumentEvents.Cancel, onCancel);
  // Once the edits are saved, editing the same field again is a new edit.
  doc.on(DocumentEvents.UpdateSuccess, forgetAll);

  return () => {
    disposed = true;
    doc.off(ElementEvents.Added, onAdded);
    doc.off(ElementEvents.Edited, onEdited);
    doc.off(ElementEvents.Invalid, onEdited);
    doc.off(ElementEvents.Reverted, forget);
    doc.off(ElementEvents.Removed, onRemoved);
    doc.off(DocumentEvents.Cancel, onCancel);
    doc.off(DocumentEvents.UpdateSuccess, forgetAll);
  };
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
  // Outlives the effect so that replacing a document in `docs`, e.g. when it
  // is saved, doesn't reset the fields being edited in the other documents.
  const trackedFieldsRef = useRef<WeakMap<
    HadronDocument,
    Map<Element, TrackedField>
  > | null>(null);

  useEffect(() => {
    const trackedFields = (trackedFieldsRef.current ??= new WeakMap());

    const cleanup = docs.map((doc) => {
      const fields = trackedFields.get(doc) ?? new Map<Element, TrackedField>();
      trackedFields.set(doc, fields);
      return trackDocumentEdits(doc, {
        fields,
        mode,
        track,
        connectionInfoRef,
      });
    });

    return () => {
      for (const off of cleanup) {
        off();
      }
    };
  }, [docs, mode, track, connectionInfoRef]);
}
