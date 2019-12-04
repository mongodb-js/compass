import removeBlanks from './remove-blanks';

describe('remove-blanks', () => {
  it('should remove empty strings', () => {
    const source = {
      _id: 1,
      empty: ''
    };
    const result = removeBlanks(source);
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
    const result = removeBlanks(source);
    expect(result).to.deep.equal({
      _id: 1,
      nulled: null,
      falsed: false,
      undef: undefined
    });
  });
});
