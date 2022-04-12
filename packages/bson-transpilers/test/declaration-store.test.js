const assert = require('assert');
const DeclarationStore = require('../codegeneration/DeclarationStore');

describe('DeclarationStore', () => {
  it('adds data using #add', () => {
    const ds = new DeclarationStore();

    ds.addVar('Temp', 'objectID', (varName) => { return `objectId${varName}`; });
    assert.strictEqual(ds.length(), 1);
  });
  it('returns incremented variable names given the pre-incremented variable root-name', () => {
    const ds = new DeclarationStore();

    ds.addVar('ForTemp', 'objectID', () => { return 1; });
    assert.strictEqual(ds.next('ForTemp', 'objectID'), 'objectIDForTemp1');

    ds.addVar('ForTemp', 'objectID', () => { return 2; });
    assert.strictEqual(ds.next('ForTemp', 'objectID'), 'objectIDForTemp2');

    ds.addVar('ForTemp', 'objectID', () => { return 3; });
    assert.strictEqual(ds.next('ForTemp', 'objectID'), 'objectIDForTemp3');
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
    ds.addVar('ForTemp', 'objectID', declaration1);
    ds.addVar('ForTemp', 'objectID', declaration2);

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

    ds.addVar('ForTemp', 'objectID', declaration1);
    ds.addVar('ForTemp', 'objectID', declaration2);
    ds.addVar('ForTemp', 'objectID', declaration3);

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

    ds.addVar('ForTemp', 'objectID', declaration1);
    ds.addVar('ForTemp', 'objectID', declaration2);
    ds.addVar('ForTemp', 'objectID', declaration3);

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
  it('ignores duplications over different variables', () => {
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

    ds.addVar('ForTempA', 'objectID', declaration1);
    ds.addVar('ForTempA', 'objectID', declaration2);
    ds.addVar('ForTempB', 'objectID', declaration3);

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
  it('ignores duplications over different functions', () => {
    const ds = new DeclarationStore();
    const declaration1 = 'var x := func() {}';
    const declaration2 = 'var x := func() {}';
    const declaration3 = 'var y := func() {}';

    ds.addFunc(declaration1);
    ds.addFunc(declaration2);
    ds.addFunc(declaration3);

    const expected = []
      .concat('var x := func() {}')
      .concat('')
      .concat('var y := func() {}')
      .join('\n');
    assert.strictEqual(ds.toString(), expected);
  });
});
