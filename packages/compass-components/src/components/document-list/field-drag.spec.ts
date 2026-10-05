import { expect } from 'chai';
import { BSON } from 'bson';
import {
  DOCUMENT_FIELD_DRAG_TYPE,
  getDraggedDocumentField,
  setDraggedDocumentField,
} from './field-drag';

/**
 * jsdom has no DataTransfer, and the real one only exposes its data during a
 * drag, so tests use this stand-in with the same surface the helpers rely on.
 */
function fakeDataTransfer() {
  const store: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;
  return {
    get types() {
      return Object.keys(store);
    },
    setData(type: string, value: string) {
      store[type] = value;
    },
    getData(type: string) {
      return store[type] ?? '';
    },
  } as unknown as DataTransfer;
}

describe('field-drag', function () {
  it('round trips a field and its value', function () {
    const dataTransfer = fakeDataTransfer();

    setDraggedDocumentField(dataTransfer, {
      field: 'customer.address.city',
      value: 'London',
    });

    expect(Array.from(dataTransfer.types)).to.include(DOCUMENT_FIELD_DRAG_TYPE);
    expect(getDraggedDocumentField(dataTransfer)).to.deep.equal({
      field: 'customer.address.city',
      value: 'London',
    });
  });

  it('preserves BSON types through the round trip', function () {
    const dataTransfer = fakeDataTransfer();
    const objectId = new BSON.ObjectId('6a709bfd0ce4efdf334e9979');

    setDraggedDocumentField(dataTransfer, { field: '_id', value: objectId });

    const dragged = getDraggedDocumentField(dataTransfer);
    expect(dragged?.value).to.be.instanceOf(BSON.ObjectId);
    expect(String(dragged?.value)).to.equal(String(objectId));
  });

  it('round trips a whole subdocument', function () {
    const dataTransfer = fakeDataTransfer();

    setDraggedDocumentField(dataTransfer, {
      field: 'user',
      value: { name: 'John', visits: new BSON.Int32(3) },
    });

    const value = getDraggedDocumentField(dataTransfer)?.value as {
      name: string;
      visits: unknown;
    };
    expect(value.name).to.equal('John');
    // Numeric types are kept rather than collapsed to JavaScript numbers, so
    // that a dragged field carries the same types the document view shows.
    expect(value.visits).to.be.instanceOf(BSON.Int32);
    expect(Number(value.visits)).to.equal(3);
  });

  it('keeps 64 bit integers exact', function () {
    const dataTransfer = fakeDataTransfer();
    // Larger than Number.MAX_SAFE_INTEGER: this is the case that would be
    // silently rounded if values went through plain JSON.
    const big = BSON.Long.fromString('9007199254740993');

    setDraggedDocumentField(dataTransfer, { field: 'counter', value: big });

    const value = getDraggedDocumentField(dataTransfer)?.value;
    expect(value).to.be.instanceOf(BSON.Long);
    expect(String(value)).to.equal('9007199254740993');
  });

  it('returns null when the drag did not come from the document list', function () {
    expect(getDraggedDocumentField(fakeDataTransfer())).to.equal(null);
  });

  it('returns null for malformed drag data instead of throwing', function () {
    const notJson = fakeDataTransfer();
    notJson.setData(DOCUMENT_FIELD_DRAG_TYPE, 'not json at all');
    expect(getDraggedDocumentField(notJson)).to.equal(null);

    const noField = fakeDataTransfer();
    noField.setData(DOCUMENT_FIELD_DRAG_TYPE, '{"value":1}');
    expect(getDraggedDocumentField(noField)).to.equal(null);
  });
});
