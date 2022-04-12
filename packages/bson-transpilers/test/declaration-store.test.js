const assert = require('assert');
const DeclarationStore = require('../codegeneration/DeclarationStore');

describe('DeclarationStore', () => {
  it('adds data using #add', () => {
    const ds = new DeclarationStore();

    ds.add('Temp', 'objectID', (varName) => { return `objectId${varName}`; });
    assert.strictEqual(ds.length(), 1);
  });
  it('returns incremented variable names given the pre-incremented variable root-name', () => {
    const ds = new DeclarationStore();

    ds.add('Temp', 'objectID', () => { return 1; });
    assert.strictEqual(ds.next('Temp', 'objectID'), 'objectIDForTemp1');

    ds.add('Temp', 'objectID', () => { return 2; });
    assert.strictEqual(ds.next('Temp', 'objectID'), 'objectIDForTemp2');

    ds.add('Temp', 'objectID', () => { return 3; });
    assert.strictEqual(ds.next('Temp', 'objectID'), 'objectIDForTemp3');
  });
  it('stringifies multiple variables declarations', () => {
    const ds = new DeclarationStore();
    const declaration1 = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex()`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };

    const declaration2 = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex("5ab901c29ee65f5c8550c5b9")`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };
    ds.add('Temp', 'objectID', declaration1);
    ds.add('Temp', 'objectID', declaration2);

    const expected = []
      .concat('objectIDForTemp, err := primitive.ObjectIDFromHex()')
      .concat('if err != nil {')
      .concat('    log.Fatal(err)')
      .concat('}')
      .concat('')
      .concat('objectIDForTemp1, err := primitive.ObjectIDFromHex("5ab901c29ee65f5c8550c5b9")')
      .concat('if err != nil {')
      .concat('    log.Fatal(err)')
      .concat('}')
      .join('\n');
    assert.strictEqual(ds.toString(), expected);
  });
  it('skips defining declarations for multiple of the exact same declaration (1)', () => {
    const ds = new DeclarationStore();
    const declaration1 = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex()`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };

    const declaration2 = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex("5ab901c29ee65f5c8550c5b9")`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };

    const declaration3 = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex()`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };

    ds.add('Temp', 'objectID', declaration1);
    ds.add('Temp', 'objectID', declaration2);
    ds.add('Temp', 'objectID', declaration3);

    const expected = []
      .concat('objectIDForTemp, err := primitive.ObjectIDFromHex()')
      .concat('if err != nil {')
      .concat('    log.Fatal(err)')
      .concat('}')
      .concat('')
      .concat('objectIDForTemp1, err := primitive.ObjectIDFromHex("5ab901c29ee65f5c8550c5b9")')
      .concat('if err != nil {')
      .concat('    log.Fatal(err)')
      .concat('}')
      .join('\n');
    assert.strictEqual(ds.toString(), expected);
  });
  it('skips defining declarations for multiple of the exact same declaration (2)', () => {
    const ds = new DeclarationStore();
    const declaration1 = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex()`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };

    const declaration2 = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex("5ab901c29ee65f5c8550c5b9")`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };

    const declaration3 = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex("5ab901c29ee65f5c8550c5b9")`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };

    ds.add('Temp', 'objectID', declaration1);
    ds.add('Temp', 'objectID', declaration2);
    ds.add('Temp', 'objectID', declaration3);

    const expected = []
      .concat('objectIDForTemp, err := primitive.ObjectIDFromHex()')
      .concat('if err != nil {')
      .concat('    log.Fatal(err)')
      .concat('}')
      .concat('')
      .concat('objectIDForTemp1, err := primitive.ObjectIDFromHex("5ab901c29ee65f5c8550c5b9")')
      .concat('if err != nil {')
      .concat('    log.Fatal(err)')
      .concat('}')
      .join('\n');
    assert.strictEqual(ds.toString(), expected);
  });
  it('ignores duplications over different temps', () => {
    const ds = new DeclarationStore();
    const declaration1 = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex()`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };

    const declaration2 = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex("5ab901c29ee65f5c8550c5b9")`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };

    const declaration3 = (varName) => {
      return []
        .concat(`${varName}, err := primitive.ObjectIDFromHex("5ab901c29ee65f5c8550c5b9")`)
        .concat('if err != nil {')
        .concat('    log.Fatal(err)')
        .concat('}')
        .join('\n');
    };

    ds.add('TempA', 'objectID', declaration1);
    ds.add('TempA', 'objectID', declaration2);
    ds.add('TempB', 'objectID', declaration3);

    const expected = []
      .concat('objectIDForTempA, err := primitive.ObjectIDFromHex()')
      .concat('if err != nil {')
      .concat('    log.Fatal(err)')
      .concat('}')
      .concat('')
      .concat('objectIDForTempA1, err := primitive.ObjectIDFromHex("5ab901c29ee65f5c8550c5b9")')
      .concat('if err != nil {')
      .concat('    log.Fatal(err)')
      .concat('}')
      .concat('')
      .concat('objectIDForTempB, err := primitive.ObjectIDFromHex("5ab901c29ee65f5c8550c5b9")')
      .concat('if err != nil {')
      .concat('    log.Fatal(err)')
      .concat('}')
      .join('\n');
    assert.strictEqual(ds.toString(), expected);
  });
});
