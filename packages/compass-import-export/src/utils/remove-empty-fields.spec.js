import removeEmptyFields from './remove-empty-fields';

describe('remove-empty-fields', () => {
  it('should remove empty strings', () => {
    const source = {
      _id: 1,
      empty: ''
    };
    const result = removeEmptyFields(source);
    expect(result).to.deep.equal({ _id: 1 });
  });

  it('should remove empty strings but leave falsy values', () => {
    const source = {
      _id: 1,
      empty: '',
      nulled: null,
      falsed: false,
      undef: undefined
    };
    const result = removeEmptyFields(source);
    expect(result).to.deep.equal({
      _id: 1,
      nulled: null,
      falsed: false,
      undef: undefined
    });
  });
});
