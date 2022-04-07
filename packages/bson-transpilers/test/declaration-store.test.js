const assert = require('assert');
const DeclarationStore = require('../codegeneration/DeclarationStore');

describe('DeclarationStore', () => {
  it('adds data using #add', () => {
    const ds = new DeclarationStore();

    ds.add('objectID', (varName) => { return `objectId${varName}`; });
    assert.strictEqual(ds.store.length, 1);
  });
  it('returns incremented variable names given the pre-incremented variable root-name', () => {
    const ds = new DeclarationStore();

    ds.add('objectID', () => {});
    assert.strictEqual(ds.next('objectID'), 'objectID1');

    ds.add('objectID', () => {});
    assert.strictEqual(ds.next('objectID'), 'objectID2');

    ds.add('objectID', () => {});
    assert.strictEqual(ds.next('objectID'), 'objectID3');
  });
  it('stringifies multiple variables declarations', () => {
    const ds = new DeclarationStore();
    const declaration = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex()`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };

    ds.add('objectID', declaration);
    ds.add('objectID', declaration);

    const expected = []
      .concat('objectID, err := primitive.ObjectIDFromHex()')
      .concat('if err != nil {')
      .concat('    log.Fatal(err)')
      .concat('}')
      .concat('')
      .concat('objectID1, err := primitive.ObjectIDFromHex()')
      .concat('if err != nil {')
      .concat('    log.Fatal(err)')
      .concat('}')
      .join('\n');
    assert.strictEqual(ds.toString(), expected);
  });
});
