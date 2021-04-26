import { MongoshInternalError } from '@mongosh/errors';
import { expect } from 'chai';
import SymbolTable, { addApi } from './symbol-table';
const s = require('../test/shell-api-signatures');

const myType = { type: 'myType', attributes: { myAttr: s.unknown } };
const signatures = Object.keys(s).reduce((t, k) => {
  if (k === 'unknown') {
    t[k] = s[k];
  } else {
    t[k] = addApi(s[k]);
  }
  return t;
}, {}) as any;

describe('SymbolTable', () => {
  describe('initialization', () => {
    it('signatures loaded', () => {
      const st = new SymbolTable(
        [{}],
        { testClass: { type: 'testClass' }, unknown: { type: 'unknown', attributes: {} } }
      );
      expect(st.scopeAt(0)).to.deep.equal({
        testClass: {
          api: true,
          type: 'classdef',
          returnType: { type: 'testClass' },
          hasAsyncChild: false,
          returnsPromise: false
        }
      });
    });
  });
  describe('#initializeApiObjects', () => {
    it('adds API objects to top-level scope', () => {
      const st = new SymbolTable(
        [{}],
        { testClass: { type: 'testClass' }, unknown: { type: 'unknown', attributes: {} } }
      );
      st.initializeApiObjects({
        db: signatures.Database,
        coll: signatures.Collection,
        m: signatures.Mongo
      });
      expect(st.scopeAt(0)).to.deep.equal({
        db: signatures.Database,
        coll: signatures.Collection,
        m: signatures.Mongo,
        testClass: {
          api: true,
          type: 'classdef',
          returnType: { type: 'testClass' },
          hasAsyncChild: false,
          returnsPromise: false
        }
      });
    });
  });
  describe('#remover', () => {
    const st = new SymbolTable([{}], {});
    it('removes the path attribute if present', () => {
      expect(JSON.stringify({
        type: 'a', attributes: {
          b: { type: 'b' },
          c: { type: 'func', attributes: { e: { f: 1, path: 'PATH' } } }
        },
        path: 'PATH'
      }, st.replacer)).to.equal(JSON.stringify({
        type: 'a', attributes: {
          b: { type: 'b' },
          c: { type: 'func', attributes: { e: { f: 1 } } }
        }
      }));
    });
  });
  describe('#compareTypes', () => {
    const st = new SymbolTable([{}], {});
    it('compares equal types', () => {
      expect(st.compareTypes(
        { type: 'same', attributes: {}, path: 'ONE' },
        { type: 'same', attributes: {}, path: 'TWO' },
      )).to.be.true;
    });
    it('compares unequal types', () => {
      expect(st.compareTypes(
        { type: 'same', attributes: { missing: true } },
        { type: 'same', attributes: {} },
      )).to.be.false;
    });
    it('throws an exception if comparison fails', () => {
      const replacer = st.replacer;
      st.replacer = () => { throw new Error('crap'); };
      try {
        st.compareTypes(
          { type: 'same', attributes: { missing: true } },
          { type: 'same', attributes: {} },
        );
      } catch (e) {
        expect(e).to.be.instanceOf(MongoshInternalError);
        expect(e.message).to.contain('Internal error occurred for comparing symbols');
        return;
      } finally {
        st.replacer = replacer;
      }
      expect.fail('expected error');
    });
  });
  describe('#deepCopy', () => {
    const st = new SymbolTable([{}], {});
    st.initializeApiObjects({
      db: signatures.Database,
      coll: signatures.Collection
    });
    st.add('myDb', signatures.Database);
    st.add('myColl', signatures.Collection);
    it('creates deep copy', () => {
      const copy = st.deepCopy();
      expect(copy).to.deep.equal(st);
      expect(copy === st).to.be.false;
    });
    it('does not deep copy paths', () => {
      const path = { myPath: true };
      st.add('typeWithPath', { type: 'TypeWithPath', attributes: { a: 1 }, path: path });
      const copy2 = st.deepCopy();
      expect(copy2).to.deep.equal(st);
      expect(copy2.lookup('typeWithPath').path === st.lookup('typeWithPath').path).to.be.true;
      expect(copy2.lookup('typeWithPath').attributes === st.lookup('typeWithPath').attributes).to.be.false;
    });
    it('throws an exception if copy symbol fails', () => {
      const replacer = st.replacer;
      st.replacer = () => { return undefined; };
      try {
        st.deepCopy();
      } catch (e) {
        expect(e).to.be.instanceOf(MongoshInternalError);
        expect(e.message).to.contain('Internal error occurred for copying symbol');
        return;
      } finally {
        st.replacer = replacer;
      }
      expect.fail('expected error');
    });
  });
  describe('#lookup', () => {
    const st = new SymbolTable([{}], {});
    st.pushScope();
    st.add('db1', signatures.Database);
    st.pushScope();
    st.add('db1', signatures.Collection);
    it('returns unknown when undefined', () => {
      expect(st.lookup('myDb')).to.deep.equal({ type: 'unknown', attributes: {} });
    });
    it('finds the most recent symbol', () => {
      expect(st.lookup('db1')).to.deep.equal(signatures.Collection);
    });
  });
  describe('#add', () => {
    const st = new SymbolTable([{ db: signatures.Database }, { myVar: myType }, {}], {});
    it('adds to the most recent scope', () => {
      st.add('newVar', myType);
      expect(st.scopeAt(0)).to.deep.equal({ db: signatures.Database });
      expect(st.scopeAt(1)).to.deep.equal({ myVar: myType });
      expect(st.scopeAt(2)).to.deep.equal({ newVar: myType });
    });
    it('does not overwrite upper scope', () => {
      st.add('myVar', { type: 'myDbType', attributes: {} });
      expect(st.scopeAt(0)).to.deep.equal({ db: signatures.Database });
      expect(st.scopeAt(1)).to.deep.equal({ myVar: myType });
      expect(st.scopeAt(2)).to.deep.equal({ newVar: myType, myVar: { type: 'myDbType', attributes: {} } });
    });
  });
  describe('#addToParent', () => {
    const st = new SymbolTable([{ db: signatures.Database }], {});
    st.pushScope();
    st.pushScope();
    it('adds to the parent of the most recent scope', () => {
      st.addToParent('newVar', myType);
      expect(st.scopeAt(0)).to.deep.equal({ db: signatures.Database });
      expect(st.scopeAt(1)).to.deep.equal({ newVar: myType });
      expect(st.scopeAt(2)).to.deep.equal({});
    });
  });
  describe('#updateIfDefined', () => {
    const st = new SymbolTable([{}, { myVar: { type: 'unique' } }], {});
    st.pushScope();
    it('updates and returns true if exists', () => {
      expect(st.updateIfDefined('myVar', myType )).to.be.true;
      expect(st.scopeAt(1)).to.deep.equal({ myVar: myType });
      expect(st.scopeAt(0)).to.deep.equal({});
    });
    it('returns false for new symbols', () => {
      expect(st.updateIfDefined('newVar', myType )).to.be.false;
      expect(st.scopeAt(1)).to.deep.equal({ myVar: myType });
      expect(st.scopeAt(0)).to.deep.equal({});
    });
  });
  describe('#updateFunctionScoped', () => {
    const st = new SymbolTable([{ db: signatures.Database }], {});
    st.pushScope();
    st.pushScope();
    st.pushScope();
    const path = {
      getFunctionParent: (): any => ({
        node: { shellScope: 2 }
      })
    };
    st.updateFunctionScoped(path, 'myVar', myType, {});
    it('updates scope at 2', () => {
      expect(st.scopeAt(0)).to.deep.equal({ db: signatures.Database });
      expect(st.scopeAt(1)).to.deep.equal({});
      expect(st.scopeAt(2)).to.deep.equal({ myVar: myType });
      expect(st.scopeAt(3)).to.deep.equal({});
    });
  });
  describe('#popScope', () => {
    const st = new SymbolTable([{ db: signatures.Database }], {});
    st.pushScope();
    st.add('myVar', myType);
    it('removes most recent scope', () => {
      expect(st.popScope()).to.deep.equal({ myVar: myType });
      expect(st.depth).to.equal(1);
    });
    it('does not pop api scope', () => {
      expect(st.popScope()).to.deep.equal(undefined);
      expect(st.depth).to.equal(1);
    });
  });
  describe('#pushScope', () => {
    const st = new SymbolTable([{ db: signatures.Database }], {});
    it('returns new scope index', () => {
      expect(st.pushScope()).to.equal(1);
      expect(st.depth).to.equal(2);
      expect(st.pushScope()).to.equal(2);
      expect(st.depth).to.equal(3);
    });
  });
  describe('#compareSymbolTables', () => {
    describe('All alternatives have the same value for key', () => {
      it('adds new variable to ST', () => {
        const st = new SymbolTable([{}], {});
        const alternatives = [
          new SymbolTable([{ myVar: myType }], {}),
          new SymbolTable([{ myVar: myType }], {}),
          new SymbolTable([{ myVar: myType }], {}),
        ];
        st.compareSymbolTables(alternatives);
        expect(st.scopeAt(0)).to.deep.equal({ myVar: myType });
      });
      it('updates variable in ST', () => {
        const st = new SymbolTable([{ myVar: { type: 'unknown', attributes: {} } }], {});
        const alternatives = [
          new SymbolTable([{ myVar: myType }], {}),
          new SymbolTable([{ myVar: myType }], {}),
          new SymbolTable([{ myVar: myType }], {}),
        ];
        st.compareSymbolTables(alternatives);
        expect(st.scopeAt(0)).to.deep.equal({ myVar: myType });
      });
    });
    describe('Some alternatives are missing definition, but none are async', () => {
      it('adds new variable to ST', () => {
        const st = new SymbolTable([{}], {});
        const alternatives = [
          new SymbolTable([{ myVar: myType }], {}),
          new SymbolTable([{}], {}),
          new SymbolTable([{ myVar: myType }], {}),
        ];
        st.compareSymbolTables(alternatives);
        expect(st.scopeAt(0)).to.deep.equal({ myVar: { type: 'unknown', attributes: {} } });
      });
      it('updates variable in ST', () => {
        const st = new SymbolTable([{ myVar: signatures.Database }], {});
        const alternatives = [
          new SymbolTable([{ myVar: myType }], {}),
          new SymbolTable([{}], {}),
          new SymbolTable([{ myVar: myType }], {}),
        ];
        st.compareSymbolTables(alternatives);
        expect(st.scopeAt(0)).to.deep.equal({ myVar: { type: 'unknown', attributes: {} } });
      });
    });
    describe('Alternatives have different values but none are async', () => {
      it('adds new variable to ST', () => {
        const st = new SymbolTable([{}], {});
        const alternatives = [
          new SymbolTable([{ myVar: myType }], {}),
          new SymbolTable([{ myVar: { type: 'otherType', attributes: {} } }], {}),
          new SymbolTable([{ myVar: myType }], {}),
        ];
        st.compareSymbolTables(alternatives);
        expect(st.scopeAt(0)).to.deep.equal({ myVar: { type: 'unknown', attributes: {} } });
      });
    });
    describe('Alternatives have all the same async value', () => {
      it('adds new variable to ST', () => {
        const st = new SymbolTable([{}], {});
        const alternatives = [
          new SymbolTable([{ myVar: signatures.Database }], {}),
          new SymbolTable([{ myVar: signatures.Database }], {}),
          new SymbolTable([{ myVar: signatures.Database }], {}),
        ];
        st.compareSymbolTables(alternatives);
        expect(st.scopeAt(0)).to.deep.equal({ myVar: signatures.Database });
      });
    });
    describe('Alternatives have some async values', () => {
      describe('hasAsyncChild', () => {
        it('errors for all defined', () => {
          const st = new SymbolTable([{}], {});
          const alternatives = [
            new SymbolTable([{ myVar: signatures.Database }], {}),
            new SymbolTable([{ myVar: myType }], {}),
            new SymbolTable([{ myVar: signatures.Database }], {}),
          ];
          expect(() => st.compareSymbolTables(alternatives)).to.throw;
          expect(st.scopeAt(0)).to.deep.equal({});
        });
        it('errors for some undefined defined', () => {
          const st = new SymbolTable([{}], {});
          const alternatives = [
            new SymbolTable([{ myVar: signatures.Database }], {}),
            new SymbolTable([], {}),
            new SymbolTable([{ myVar: signatures.Database }], {}),
          ];
          expect(() => st.compareSymbolTables(alternatives)).to.throw;
          expect(st.scopeAt(0)).to.deep.equal({});
        });
      });
      describe('returnsPromise', () => {
        it('errors for all defined', () => {
          const st = new SymbolTable([{}], {});
          const alternatives = [
            new SymbolTable([{ myVar: signatures.Collection.attributes.insertOne }], {}),
            new SymbolTable([{ myVar: myType }], {}),
            new SymbolTable([{ myVar: signatures.Collection.attributes.insertOne }], {}),
          ];
          expect(() => st.compareSymbolTables(alternatives)).to.throw;
          expect(st.scopeAt(0)).to.deep.equal({});
        });
        it('errors for some undefined defined', () => {
          const st = new SymbolTable([{}], {});
          const alternatives = [
            new SymbolTable([{ myVar: signatures.Collection.attributes.insertOne }], {}),
            new SymbolTable([], {}),
            new SymbolTable([{ myVar: signatures.Database }], {}),
          ];
          expect(() => st.compareSymbolTables(alternatives)).to.throw;
          expect(st.scopeAt(0)).to.deep.equal({});
        });
        it('errors for different async signatures', () => {
          const st = new SymbolTable([{}], {});
          const alternatives = [
            new SymbolTable([{ myVar: signatures.Collection }], {}),
            new SymbolTable([{ myVar: signatures.Database }], {}),
            new SymbolTable([{ myVar: signatures.Collection }], {}),
          ];
          expect(() => st.compareSymbolTables(alternatives)).to.throw;
          expect(st.scopeAt(0)).to.deep.equal({});
        });
      });
    });
    it('fails on different stack heights', () => {
      const st = new SymbolTable([{}], {});
      const alternatives = [
        new SymbolTable([{}, { myVar: myType }], {})
      ];
      try {
        st.compareSymbolTables(alternatives);
      } catch (e) {
        expect(e).to.be.instanceOf(MongoshInternalError);
        expect(e.message).to.contain('Could not compare scopes');
        return;
      }
      expect.fail('expected error');
    });
  });
  describe('#updateAttribute', () => {
    describe('all sub types exist', () => {
      const st = new SymbolTable([{}, {
        a: { type: 'object', attributes: { b: { type: 'object', attributes: { c: { type: 'object', attributes: {} } } } } },
        a1: { type: 'object', attributes: { b: { type: 'object', attributes: { c: { type: 'object', attributes: {} } } } } }
      }], {});
      it('updates for no hasAsyncChild', () => {
        st.updateAttribute('a', ['b', 'c'], myType);
        const act = { hasAsyncChild: false, type: 'object', attributes: { b: { hasAsyncChild: false, type: 'object', attributes: { c: myType } } } };
        expect(st.scopeAt(1).a).to.deep.equal(act);
      });
      it('updates for yes hasAsyncChild', () => {
        st.updateAttribute('a1', ['b', 'c'], { hasAsyncChild: true });
        const act = { hasAsyncChild: true, type: 'object', attributes: { b: { hasAsyncChild: true, type: 'object', attributes: { c: { hasAsyncChild: true } } } } };
        expect(st.scopeAt(1).a1).to.deep.equal(act);
      });
    });
    describe('new objects need to be created', () => {
      const st = new SymbolTable([{}, {
        a: { type: 'object', attributes: {} },
        a1: { type: 'object', attributes: {} },
      }], {});
      it('updates for no hasAsyncChild', () => {
        st.updateAttribute('a', ['b', 'c'], myType);
        const act = { hasAsyncChild: false, type: 'object', attributes: { b: { hasAsyncChild: false, type: 'object', attributes: { c: myType } } } };
        expect(st.scopeAt(1).a).to.deep.equal(act);
      });
      it('updates for yes hasAsyncChild', () => {
        st.updateAttribute('a1', ['b', 'c'], { hasAsyncChild: true });
        const act = { hasAsyncChild: true, type: 'object', attributes: { b: { hasAsyncChild: true, type: 'object', attributes: { c: { hasAsyncChild: true } } } } };
        expect(st.scopeAt(1).a1).to.deep.equal(act);
      });
    });
    describe('was unknown', () => {
      const st = new SymbolTable([{}, {
        a: { type: 'unknown', attributes: {} },
        a1: { type: 'unknown', attributes: {} },
      }], {});
      it('updates for no hasAsyncChild', () => {
        st.updateAttribute('a', ['b', 'c'], myType);
        const act = { hasAsyncChild: false, type: 'object', attributes: { b: { hasAsyncChild: false, type: 'object', attributes: { c: myType } } } };
        expect(st.scopeAt(1).a).to.deep.equal(act);
      });
      it('updates for yes hasAsyncChild', () => {
        st.updateAttribute('a1', ['b', 'c'], { hasAsyncChild: true });
        const act = { hasAsyncChild: true, type: 'object', attributes: { b: { hasAsyncChild: true, type: 'object', attributes: { c: { hasAsyncChild: true } } } } };
        expect(st.scopeAt(1).a1).to.deep.equal(act);
      });
    });
  });
  describe('#saveState/#revertState', () => {
    let st;
    before(() => {
      st = new SymbolTable([{
        a: { type: 'object', attributes: {} },
        a1: { type: 'object', attributes: {} },
      }], {});
      st.pushScope();
    });
    describe('copies state and reverts after change', () => {
      it('initializes correctly', () => {
        expect(st.scopeAt(1)).deep.equals({});
      });
      it('adds item', () => {
        st.saveState();
        st.add('newItem', myType);
        expect(st.scopeAt(1)).to.deep.equal({ newItem: myType });
        st.revertState();
        expect(st.scopeAt(1)).to.deep.equal({});
      });
    });
  });
  describe('#print/#printSymbol', () => {
    const st = new SymbolTable([{
      a: { type: 'object', attributes: {} },
      a1: { type: 'object', attributes: {} },
    }], {});
    it('works without error', () => {
      st.print();
    });
  });
});
