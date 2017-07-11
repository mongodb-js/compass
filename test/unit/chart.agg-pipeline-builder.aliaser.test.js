const Aliaser = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder/aliaser');
const { expect } = require('chai');

describe('Aggregation Pipeline Builder', function() {
  describe('Aliases', function() {
    let aliaser;
    beforeEach(function() {
      aliaser = new Aliaser();
    });
    it('creates the right alias for a field/channel combination', function() {
      aliaser.assignUniqueAlias('foo', 'bar');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(1);
      expect(aliaser.aliases).to.have.all.keys('bar_foo');
      expect(aliaser.aliases.bar_foo).to.be.equal('__alias_0');
    });
    it('works with field names containing underscores', function() {
      aliaser.assignUniqueAlias('foo_foo_foo', 'bar');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(1);
      expect(aliaser.aliases).to.have.all.keys('bar_foo_foo_foo');
      expect(aliaser.aliases.bar_foo_foo_foo).to.be.equal('__alias_0');
    });
    it('does not create duplicate alias for the same field/channel combination', function() {
      aliaser.assignUniqueAlias('foo', 'bar');
      aliaser.assignUniqueAlias('foo', 'bar');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(1);
      expect(aliaser.aliases).to.have.all.keys('bar_foo');
      expect(aliaser.aliases.bar_foo).to.be.equal('__alias_0');
    });
    it('creates multiple aliases for different fields same channel', function() {
      aliaser.assignUniqueAlias('foo', 'bar');
      aliaser.assignUniqueAlias('baz', 'bar');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(2);
      expect(aliaser.aliases).to.have.all.keys(['bar_foo', 'bar_baz']);
      expect(aliaser.aliases.bar_foo).to.be.equal('__alias_0');
      expect(aliaser.aliases.bar_baz).to.be.equal('__alias_1');
    });
    it('creates multiple aliases for same field different channels', function() {
      aliaser.assignUniqueAlias('foo', 'bar');
      aliaser.assignUniqueAlias('foo', 'baz');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(2);
      expect(aliaser.aliases).to.have.all.keys(['bar_foo', 'baz_foo']);
      expect(aliaser.aliases.bar_foo).to.be.equal('__alias_0');
      expect(aliaser.aliases.baz_foo).to.be.equal('__alias_1');
    });
    it('creates multiple aliases for different fields and channels', function() {
      aliaser.assignUniqueAlias('foo', 'bar');
      aliaser.assignUniqueAlias('fii', 'bor');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(2);
      expect(aliaser.aliases).to.have.all.keys(['bar_foo', 'bor_fii']);
      expect(aliaser.aliases.bar_foo).to.be.equal('__alias_0');
      expect(aliaser.aliases.bor_fii).to.be.equal('__alias_1');
    });
  });
});
