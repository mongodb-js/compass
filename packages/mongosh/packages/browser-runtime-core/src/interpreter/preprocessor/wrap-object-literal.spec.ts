import { expect } from 'chai';
import { wrapObjectLiteral } from './wrap-object-literal';

describe('wrapObjectLiteral', () => {
  it('wraps an object literal so it wont be evaluated as block', () => {
    expect(wrapObjectLiteral('{x: 2}')).to.equal('({x: 2})');
  });

  it('does not wrap other code', () => {
    expect(wrapObjectLiteral('f()')).to.equal('f()');
  });

  it('wraps multiline', () => {
    expect(wrapObjectLiteral('{x:\n2}')).to.equal('({x:\n2})');
  });

  it('ignores surrounding whitespaces', () => {
    expect(wrapObjectLiteral('\n    {x: 2}  \n ')).to.equal('(\n    {x: 2}  \n )');
  });

  it.skip('should not wrap multiple statements', () => {
    // TODO: for some reason this is the default behaviour in node repl and devtools,
    // as is now it wraps everything, which breaks the code.
    expect(wrapObjectLiteral('{x: 2}; {x: 2}')).to.equal('{x: 2}; {x: 2}');
  });
});

