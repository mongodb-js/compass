import { expect } from 'chai';
import { nbsp } from './nbsp';

const NBSP = '\u00A0';

describe('nbsp', function () {
  it('replaces leading spaces with non-breaking spaces', function () {
    expect(nbsp('\u0020\u0020name')).to.equal(`${NBSP}${NBSP}name`);
  });

  it('replaces trailing spaces with non-breaking spaces', function () {
    expect(nbsp('name\u0020\u0020')).to.equal(`name${NBSP}${NBSP}`);
  });

  it('replaces both leading and trailing spaces', function () {
    expect(nbsp('\u0020\u0020name\u0020\u0020')).to.equal(
      `${NBSP}${NBSP}name${NBSP}${NBSP}`
    );
  });

  it('preserves a single internal space (allows wrapping)', function () {
    expect(nbsp('my\u0020name')).to.equal('my\u0020name');
  });

  it('preserves internal runs of 2+ spaces as non-breaking spaces', function () {
    expect(nbsp('a\u0020\u0020b\u0020\u0020\u0020c')).to.equal(
      `a${NBSP}${NBSP}b${NBSP}${NBSP}${NBSP}c`
    );
  });

  it('returns unchanged when no edge or repeated spaces', function () {
    expect(nbsp('name')).to.equal('name');
  });

  it('handles all-spaces string', function () {
    expect(nbsp('\u0020\u0020\u0020')).to.equal(`${NBSP}${NBSP}${NBSP}`);
  });

  it('preserves a single leading and trailing space', function () {
    expect(nbsp('\u0020name\u0020')).to.equal(`${NBSP}name${NBSP}`);
  });
});
