import { EJSON } from 'bson';

/**
 * Drag data type set when a field is dragged out of the document list.
 *
 * Dragging a field always puts a human readable `text/plain` representation on
 * the drag event so that it can be dropped into any editor. This type carries
 * the same field in structured form, so that drop targets inside Compass can
 * act on the actual BSON value instead of parsing the display string back.
 */
export const DOCUMENT_FIELD_DRAG_TYPE = 'application/x-mongodb-compass-field';

export type DraggedDocumentField = {
  /** Dot notation path of the dragged field. Array indexes are skipped. */
  field: string;
  /** Value of the dragged field. */
  value: unknown;
};

/**
 * Values are serialised as canonical extended JSON so that BSON types survive
 * the round trip through the drag event, which can only carry strings.
 */
export function setDraggedDocumentField(
  dataTransfer: DataTransfer,
  dragged: DraggedDocumentField
): void {
  dataTransfer.setData(
    DOCUMENT_FIELD_DRAG_TYPE,
    EJSON.stringify(dragged, { relaxed: false })
  );
}

/**
 * Reads a field dragged from the document list, or returns null when the drag
 * did not come from there. Drops come from user input, so malformed data is
 * treated as "not ours" rather than as an error.
 */
export function getDraggedDocumentField(
  dataTransfer: DataTransfer
): DraggedDocumentField | null {
  const raw = dataTransfer.getData(DOCUMENT_FIELD_DRAG_TYPE);
  if (!raw) {
    return null;
  }
  try {
    const parsed = EJSON.parse(raw, { relaxed: false }) as DraggedDocumentField;
    return typeof parsed?.field === 'string' ? parsed : null;
  } catch {
    return null;
  }
}
