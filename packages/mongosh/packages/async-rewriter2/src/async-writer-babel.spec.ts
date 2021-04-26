import AsyncWriter from './';
import childProcess from 'child_process';
import path from 'path';
import { promisify } from 'util';
import vm from 'vm';
import sinon from 'ts-sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
const execFile = promisify(childProcess.execFile);

describe('AsyncWriter', () => {
  let implicitlyAsyncFn: sinon.SinonStub;
  let plainFn: sinon.SinonStub;
  let implicitlyAsyncMethod: sinon.SinonStub;
  let plainMethod: sinon.SinonStub;
  let implicitlyAsyncValue: any;
  let ctx: any;
  let runTranspiledCode: (code: string, context?: any) => any;
  let runUntranspiledCode: (code: string, context?: any) => any;
  let asyncWriter: AsyncWriter;

  beforeEach(function() {
    implicitlyAsyncFn = sinon.stub();
    plainFn = sinon.stub();
    implicitlyAsyncMethod = sinon.stub();
    plainMethod = sinon.stub();
    implicitlyAsyncValue = undefined;

    asyncWriter = new AsyncWriter();
    ctx = vm.createContext({
      expect,
      console,
      implicitlyAsyncFn: function(...args: any[]) {
        return Object.assign(
          Promise.resolve(implicitlyAsyncFn.call(this, ...args)),
          { [Symbol.for('@@mongosh.syntheticPromise')]: true });
      },
      plainFn,
      obj: {
        implicitlyAsyncMethod: function(...args: any[]) {
          return Object.assign(
            Promise.resolve(implicitlyAsyncMethod.call(this, ...args)),
            { [Symbol.for('@@mongosh.syntheticPromise')]: true });
        },
        plainMethod
      },
      get implicitlyAsyncValue() {
        return Object.assign(
          Promise.resolve(implicitlyAsyncValue),
          { [Symbol.for('@@mongosh.syntheticPromise')]: true });
      }
    });
    runTranspiledCode = (code: string, context?: any) => {
      const transpiled = asyncWriter.process(code);
      return runUntranspiledCode(transpiled, context);
    };
    runUntranspiledCode = (code: string, context?: any) => {
      return vm.runInContext(code, context ?? ctx);
    };
  });

  before(() => {
    process.on('unhandledRejection', err => { throw err; });
  });

  context('basic testing', () => {
    it('evaluates plain literal expressions', () => {
      expect(runTranspiledCode('42')).to.equal(42);
      expect(runTranspiledCode('"42"')).to.equal('42');
      expect(runTranspiledCode('false')).to.equal(false);
      expect(runTranspiledCode('null')).to.equal(null);
      expect(runTranspiledCode('undefined')).to.equal(undefined);
      expect(runTranspiledCode('[1,2,3]')).to.deep.equal([1, 2, 3]);
      expect(runTranspiledCode('({ a: 10 })')).to.deep.equal({ a: 10 });
    });

    it('does not auto-resolve Promises automatically', () => {
      expect(runTranspiledCode('Promise.resolve([])').constructor.name).to.equal('Promise');
      expect(runTranspiledCode('Promise.resolve([]).constructor').name).to.equal('Promise');
      expect(runTranspiledCode('Promise.resolve([]).constructor.name')).to.equal('Promise');
    });

    it('works fine when immediately receiving a rejected Promise', async() => {
      try {
        await runTranspiledCode('Promise.reject(42)');
        expect.fail('missed exception');
      } catch (err) {
        expect(err).to.equal(42);
      }
    });
  });

  context('scoping', () => {
    it('adds functions to the global scope as expected', () => {
      const f = runTranspiledCode('function f() {}');
      expect(f.constructor.name).to.equal('Function');
      expect(ctx.f).to.equal(f);
    });

    it('adds var declarations to the global scope as expected', () => {
      const a = runTranspiledCode('var a = 10;');
      expect(a).to.equal(10);
      expect(ctx.a).to.equal(a);
    });

    it('adds let declarations to the global scope as expected (unlike regular JS)', () => {
      const a = runTranspiledCode('let a = 10;');
      expect(a).to.equal(undefined);
      expect(ctx.a).to.equal(10);
    });

    it('adds const declarations to the global scope as expected (unlike regular JS)', () => {
      const a = runTranspiledCode('const a = 11;');
      expect(a).to.equal(undefined);
      expect(ctx.a).to.equal(11);
    });

    it('adds block-scoped functions to the global scope as expected', () => {
      const f = runTranspiledCode('f(); { function f() {} }');
      expect(f.constructor.name).to.equal('Function');
      expect(ctx.f).to.equal(f);
    });

    it('adds block-scoped var declarations to the global scope as expected', () => {
      const a = runTranspiledCode('{ var a = 10; }');
      expect(a).to.equal(10);
      expect(ctx.a).to.equal(a);
    });

    it('does not add block-scoped let declarations to the global scope', () => {
      const a = runTranspiledCode('{ let a = 10; a }');
      expect(a).to.equal(10);
      expect(ctx.a).to.equal(undefined);
    });

    it('does not make let declarations implicit completion records', () => {
      const a = runTranspiledCode('{ let a = 10; }');
      expect(a).to.equal(undefined);
      expect(ctx.a).to.equal(undefined);
    });

    it('does not make const declarations implicit completion records', () => {
      const a = runTranspiledCode('{ const a = 10; }');
      expect(a).to.equal(undefined);
      expect(ctx.a).to.equal(undefined);
    });

    it('moves top-level classes into the top-level scope', () => {
      const A = runTranspiledCode('class A {}');
      expect(A.constructor.name).to.equal('Function');
      expect(A.name).to.equal('A');
      expect(ctx.A).to.equal(A);
    });

    it('does not move classes from block scopes to the top-level scope', () => {
      const A = runTranspiledCode('{ class A {} }');
      expect(A).to.equal(undefined);
      expect(ctx.A).to.equal(undefined);
    });

    it('does not make top-level classes accessible before their definition', () => {
      expect(() => runTranspiledCode('var a = new A(); class A {}')).to.throw();
    });

    it('does not make block-scoped classes accessible before their definition', () => {
      expect(() => runTranspiledCode('{ var a = new A(); class A {} }')).to.throw();
    });
  });

  context('implicit awaiting', () => {
    it('does not implicitly await plain function calls', async() => {
      plainFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode('plainFn()');
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(undefined);
      expect((await ret).foo).to.equal('bar');

      expect(await runTranspiledCode('plainFn().foo')).to.equal(undefined);
    });

    it('marks function calls as implicitly awaited when requested', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode('implicitlyAsyncFn()');
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(true);
      expect((await ret).foo).to.equal('bar');

      expect(await runTranspiledCode('implicitlyAsyncFn().foo')).to.equal('bar');
    });

    it('does not implicitly await plain method calls', async() => {
      plainMethod.resolves({ foo: 'bar' });
      const ret = runTranspiledCode('obj.plainMethod()');
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(undefined);
      expect((await ret).foo).to.equal('bar');

      expect(await runTranspiledCode('obj.plainMethod().foo')).to.equal(undefined);
    });

    it('marks method calls as implicitly awaited when requested', async() => {
      implicitlyAsyncMethod.resolves({ foo: 'bar' });
      const ret = runTranspiledCode('obj.implicitlyAsyncMethod()');
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(true);
      expect((await ret).foo).to.equal('bar');

      expect(await runTranspiledCode('obj.implicitlyAsyncMethod().foo')).to.equal('bar');
    });

    it('can implicitly await inside of class methods', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode(`class A {
        method() { return implicitlyAsyncFn().foo; }
      }; new A().method()`);
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(true);
      expect(await ret).to.equal('bar');
    });

    it('can implicitly await inside of functions', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode(`(function() {
        return implicitlyAsyncFn().foo;
      })()`);
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(true);
      expect(await ret).to.equal('bar');
    });

    it('can implicitly await inside of async functions', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode(`(async function() {
        return implicitlyAsyncFn().foo;
      })()`);
      expect(ret.constructor.name).to.equal('Promise');
      expect(await ret).to.equal('bar');
    });

    it('can implicitly await inside of async generator functions', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode(`(async function() {
        const gen = (async function*() {
          yield implicitlyAsyncFn().foo;
        })();
        for await (const value of gen) return value;
      })()`);
      expect(ret.constructor.name).to.equal('Promise');
      expect(await ret).to.equal('bar');
    });

    it('can implicitly await inside of shorthand arrow functions', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode('(() => implicitlyAsyncFn().foo)()');
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(true);
      expect(await ret).to.equal('bar');
    });

    it('can implicitly await inside of block-statement arrow functions', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode('(() => { return implicitlyAsyncFn().foo; })()');
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(true);
      expect(await ret).to.equal('bar');
    });

    it('can implicitly await inside of branches', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode(`
      if (true) {
        implicitlyAsyncFn().foo;
      } else {
        null;
      }`);
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(true);
      expect(await ret).to.equal('bar');
    });

    it('can implicitly await inside of loops', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode(`
      do {
        implicitlyAsyncFn().foo;
      } while(false)`);
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(true);
      expect(await ret).to.equal('bar');
    });

    it('can implicitly await inside of for loops', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode(`
      let value;
      for (let i = 0; i < 10; i++) {
        value = implicitlyAsyncFn().foo;
      }
      value`);
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(true);
      expect(await ret).to.equal('bar');
      expect(implicitlyAsyncFn).to.have.callCount(10);
    });

    it('can use for loops as weird assignments', async() => {
      const obj = { foo: null };
      implicitlyAsyncFn.resolves(obj);
      await runTranspiledCode('for (implicitlyAsyncFn().foo of ["foo", "bar"]);');
      expect(implicitlyAsyncFn).to.have.callCount(2);
      expect(obj.foo).to.equal('bar');
    });

    it('works with assignments to objects', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      const ret = runTranspiledCode(`
      const x = {};
      x.key = implicitlyAsyncFn().foo;
      x.key;`);
      expect(ret.constructor.name).to.equal('Promise');
      expect(ret[Symbol.for('@@mongosh.syntheticPromise')]).to.equal(true);
      expect(await ret).to.equal('bar');
    });

    it('works with eval', async() => {
      implicitlyAsyncFn.resolves('yes');
      expect(runTranspiledCode('eval("42")')).to.equal(42);
      expect(runTranspiledCode('let a = 43; eval("a");')).to.equal(43);
      expect(runTranspiledCode('(() => { let b = 44; return eval("b"); })()')).to.equal(44);
      expect(await runTranspiledCode(`(() => {
        globalThis.eval = implicitlyAsyncFn; return eval("b");
      })()`)).to.equal('yes');
    });

    it('allows re-declaring variables in separate snippets', () => {
      expect(runTranspiledCode('const a = 42;')).to.equal(undefined);
      expect(runTranspiledCode('const a = 43;')).to.equal(undefined);
      expect(runTranspiledCode('a;')).to.equal(43);
    });

    it('disallows re-declaring variables in the same input text', () => {
      expect(() => runTranspiledCode('const a = 42; const a = 43;'))
        .to.throw(/has already been declared/);
    });

    it('supports typeof for un-defined variables', () => {
      expect(runTranspiledCode('typeof nonexistent')).to.equal('undefined');
    });

    it('supports typeof for implicitly awaited function calls', async() => {
      implicitlyAsyncFn.resolves(0);
      expect(await runTranspiledCode('typeof implicitlyAsyncFn()')).to.equal('number');
    });

    it('supports typeof for implicitly awaited values', async() => {
      implicitlyAsyncValue = 'abc';
      expect(await runTranspiledCode('typeof implicitlyAsyncValue')).to.equal('string');
    });

    context('invalid implicit awaits', () => {
      beforeEach(() => {
        runUntranspiledCode(asyncWriter.runtimeSupportCode());
      });

      it('cannot implicitly await inside of class constructors', () => {
        implicitlyAsyncFn.resolves({ foo: 'bar' });
        expect(() => runTranspiledCode(`class A {
          constructor() { this.value = implicitlyAsyncFn().foo; }
        }; new A()`).value).to.throw('[ASYNC-10012] Result of expression "implicitlyAsyncFn()" cannot be used in this context');
      });

      it('wrapping inside async functions makes class constructors work nicely', async() => {
        implicitlyAsyncFn.resolves({ foo: 'bar' });
        expect(await runTranspiledCode(`class A {
          constructor() { this.value = (async() => implicitlyAsyncFn().foo)(); }
        }; new A()`).value).to.equal('bar');
      });

      it('cannot implicitly await inside of plain generator functions', () => {
        implicitlyAsyncFn.resolves({ foo: 'bar' });
        expect(() => runTranspiledCode(`(function() {
          const gen = (function*() {
            yield implicitlyAsyncFn().foo;
          })();
          for (const value of gen) return value;
        })()`)).to.throw('[ASYNC-10012] Result of expression "implicitlyAsyncFn()" cannot be used in this context');
      });

      it('cannot implicitly await inside of array.sort() callback', () => {
        implicitlyAsyncFn.callsFake((x, y) => x.a - y.a);
        expect(() => runTranspiledCode(`
        const arr = [{ a: 2 }, { a : 1 }];
        arr.sort((x, y) => implicitlyAsyncFn(x, y));
        `)).to.throw('[ASYNC-10012] Result of expression "compareFn(...args)" cannot be used in this context');
      });
    });
  });

  context('error handling', () => {
    it('handles syntax errors properly', () => {
      expect(() => runTranspiledCode('foo(')).to.throw(/Unexpected token/);
    });

    it('accepts comments at the end of code', async() => {
      implicitlyAsyncFn.resolves({ foo: 'bar' });
      expect(await runTranspiledCode('implicitlyAsyncFn().foo // comment')).to.equal('bar');
    });
  });

  context('recursion', () => {
    it('can deal with calling a recursive function', async() => {
      const result = runTranspiledCode(`
        function sumToN(n) {
          if (n <= 1) return 1;
          return n + sumToN(n - 1);
        }
        sumToN(2);
      `);
      expect(result).to.equal(3);
    });
  });

  context('runtime support', () => {
    beforeEach(() => {
      runUntranspiledCode(asyncWriter.runtimeSupportCode());
    });

    context('async', () => {
      it('supports Array.prototype.forEach', async() => {
        implicitlyAsyncFn.resolves({ foo: 'bar' });
        expect(await runTranspiledCode(`
          const a = [implicitlyAsyncFn];
          let value;
          a.forEach((fn) => { value = fn().foo; });
          value;
        `)).to.equal('bar');
      });

      it('supports Array.prototype.map', async() => {
        implicitlyAsyncFn.resolves({ foo: 'bar' });
        expect((await runTranspiledCode(`
          [implicitlyAsyncFn].map((fn) => fn());
        `))[0].foo).to.equal('bar');
      });

      it('supports Array.prototype.find', async() => {
        implicitlyAsyncFn.resolves({ foo: 'bar' });
        expect((await runTranspiledCode(`
          [() => 0, implicitlyAsyncFn].find((fn) => fn())();
        `)).foo).to.equal('bar');
      });

      it('supports Array.prototype.some', async() => {
        implicitlyAsyncFn.callsFake(value => value);
        expect(await runTranspiledCode(`
          [{ prop: 'prop' }].some((value) => implicitlyAsyncFn(value).prop === 'prop');
        `)).to.equal(true);
      });

      it('supports Array.prototype.every', async() => {
        implicitlyAsyncFn.callsFake(value => value);
        expect(await runTranspiledCode(`
          [{ prop: 'prop' }].every((value) => implicitlyAsyncFn(value).prop === 'prop');
        `)).to.equal(true);
      });

      it('supports Array.prototype.filter', async() => {
        implicitlyAsyncFn.callsFake(value => value);
        expect(await runTranspiledCode(`
          [
            { prop: 'prop' },
            { prop: 'other' }
          ].filter((value) => implicitlyAsyncFn(value).prop === 'prop');
        `)).to.deep.equal([{ prop: 'prop' }]);
      });

      it('supports Array.prototype.findIndex', async() => {
        implicitlyAsyncFn.resolves({ foo: 'bar' });
        expect(await runTranspiledCode(`
          const arr = [() => 0, implicitlyAsyncFn];
          arr.findIndex((fn) => fn());
        `)).to.equal(1);
      });

      it('supports Array.prototype.reduce', async() => {
        implicitlyAsyncFn.callsFake((left, right) => left + right);
        expect(await runTranspiledCode(`
          [1,2,3].reduce(implicitlyAsyncFn, 0)
        `)).to.equal(6);
      });

      it('supports Array.prototype.reduceRight', async() => {
        implicitlyAsyncFn.callsFake((left, right) => left + right);
        expect(await runTranspiledCode(`
          [1,2,3].reduceRight(implicitlyAsyncFn, 0)
        `)).to.equal(6);
      });

      it('supports TypedArray.prototype.map', async() => {
        implicitlyAsyncFn.callsFake(v => v + 1);
        expect(await runTranspiledCode(`
          new Uint8Array([ 1, 2, 3 ]).map(implicitlyAsyncFn).reduce((a, b) => a + b)
        `)).to.equal(9);
      });

      it('supports TypedArray.prototype.filter', async() => {
        implicitlyAsyncFn.callsFake(v => v < 3);
        expect(await runTranspiledCode(`
          new Uint8Array([ 1, 2, 3 ]).filter(implicitlyAsyncFn).reduce((a, b) => a + b)
        `)).to.equal(3);
      });

      it('supports Map.prototype.forEach', async() => {
        const map = await runTranspiledCode(`
          const map = new Map([[1,2], [3,4]]);
          map.forEach(implicitlyAsyncFn);
          map
        `);
        expect(implicitlyAsyncFn).to.have.been.calledWith(2, 1, map);
        expect(implicitlyAsyncFn).to.have.been.calledWith(4, 3, map);
      });

      it('supports Set.prototype.forEach', async() => {
        const set = await runTranspiledCode(`
          const set = new Set([ 2, 4, 6 ]);
          set.forEach(implicitlyAsyncFn);
          set
        `);
        expect(implicitlyAsyncFn).to.have.been.calledWith(2, 2, set);
        expect(implicitlyAsyncFn).to.have.been.calledWith(4, 4, set);
        expect(implicitlyAsyncFn).to.have.been.calledWith(6, 6, set);
      });

      it('supports Array.prototype.flatMap', async() => {
        implicitlyAsyncFn.callsFake(x => [ x - 1, x ]);
        const arr = await runTranspiledCode(`
          const arr = [ 2, 4, 6, 8 ];
          arr.flatMap(implicitlyAsyncFn)
        `);
        expect(arr).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8]);
      });
    });

    context('synchronous', () => {
      it('supports Array.prototype.forEach', () => {
        plainFn.returns({ foo: 'bar' });
        expect(runTranspiledCode(`
          const a = [plainFn];
          let value;
          a.forEach((fn) => { value = fn().foo; });
          value;
        `)).to.equal('bar');
      });

      it('supports Array.prototype.map', () => {
        plainFn.returns({ foo: 'bar' });
        expect(( runTranspiledCode(`
          [plainFn].map((fn) => fn());
        `))[0].foo).to.equal('bar');
      });

      it('supports Array.prototype.find', () => {
        plainFn.returns({ foo: 'bar' });
        expect(( runTranspiledCode(`
          [() => 0, plainFn].find((fn) => fn())();
        `)).foo).to.equal('bar');
      });

      it('supports Array.prototype.some', () => {
        plainFn.callsFake(value => value);
        expect(runTranspiledCode(`
          [{ prop: 'prop' }].some((value) => plainFn(value).prop === 'prop');
        `)).to.equal(true);
      });

      it('supports Array.prototype.every', () => {
        plainFn.callsFake(value => value);
        expect(runTranspiledCode(`
          [{ prop: 'prop' }].every((value) => plainFn(value).prop === 'prop');
        `)).to.equal(true);
      });

      it('supports Array.prototype.filter', () => {
        plainFn.callsFake(value => value);
        expect(runTranspiledCode(`
          [
            { prop: 'prop' },
            { prop: 'other' }
          ].filter((value) => plainFn(value).prop === 'prop');
        `)).to.deep.equal([{ prop: 'prop' }]);
      });

      it('supports Array.prototype.findIndex', () => {
        plainFn.returns({ foo: 'bar' });
        expect(runTranspiledCode(`
          const arr = [() => 0, plainFn];
          arr.findIndex((fn) => fn());
        `)).to.equal(1);
      });

      it('supports Array.prototype.reduce', () => {
        plainFn.callsFake((left, right) => left + right);
        expect(runTranspiledCode(`
          [1,2,3].reduce(plainFn, 0)
        `)).to.equal(6);
      });

      it('supports Array.prototype.reduceRight', () => {
        plainFn.callsFake((left, right) => left + right);
        expect(runTranspiledCode(`
          [1,2,3].reduceRight(plainFn, 0)
        `)).to.equal(6);
      });

      it('supports TypedArray.prototype.map', () => {
        plainFn.callsFake(v => v + 1);
        expect(runTranspiledCode(`
          new Uint8Array([ 1, 2, 3 ]).map(plainFn).reduce((a, b) => a + b)
        `)).to.equal(9);
      });

      it('supports TypedArray.prototype.filter', () => {
        plainFn.callsFake(v => v < 3);
        expect(runTranspiledCode(`
          new Uint8Array([ 1, 2, 3 ]).filter(plainFn).reduce((a, b) => a + b)
        `)).to.equal(3);
      });

      it('supports Map.prototype.forEach', () => {
        const map = runTranspiledCode(`
          const map = new Map([[1,2], [3,4]]);
          map.forEach(plainFn);
          map
        `);
        expect(plainFn).to.have.been.calledWith(2, 1, map);
        expect(plainFn).to.have.been.calledWith(4, 3, map);
      });

      it('supports Set.prototype.forEach', () => {
        const set = runTranspiledCode(`
          const set = new Set([ 2, 4, 6 ]);
          set.forEach(plainFn);
          set
        `);
        expect(plainFn).to.have.been.calledWith(2, 2, set);
        expect(plainFn).to.have.been.calledWith(4, 4, set);
        expect(plainFn).to.have.been.calledWith(6, 6, set);
      });

      it('supports Array.prototype.flatMap', () => {
        plainFn.callsFake(x => [ x - 1, x ]);
        const arr = runTranspiledCode(`
          const arr = [ 2, 4, 6, 8 ];
          arr.flatMap(plainFn)
        `);
        expect(arr).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8]);
      });

      it('supports Array.prototype.sort', () => {
        plainFn.callsFake((x, y) => x.a - y.a);
        const arr = runTranspiledCode(`
          const arr = [ { a: 1 }, { a: 9 }, { a: 4 }, { a: 16 } ];
          arr.sort(plainFn)
        `);
        expect(arr).to.deep.equal([ { a: 1 }, { a: 4 }, { a: 9 }, { a: 16 } ]);
      });

      it('supports TypedArray.prototype.sort', () => {
        plainFn.callsFake((x, y) => x - y);
        const arr = runTranspiledCode(`
          const arr = new Uint8Array([1, 9, 4, 16]);
          arr.sort(plainFn)
        `);
        expect(arr).to.deep.equal(new Uint8Array([1, 4, 9, 16]));
      });

      it('supports Array.prototype.sort without callback', () => {
        const arr = runTranspiledCode(`
          const arr = [ 1, 9, 4, 16 ];
          arr.sort()
        `);
        expect(arr).to.deep.equal([ 1, 16, 4, 9 ]);
      });
    });

    context('Function.prototype.toString', () => {
      it('returns the original function source', () => {
        expect(runTranspiledCode('Function.prototype.toString.call(() => {})'))
          .to.equal('() => {}');
        expect(runTranspiledCode('Function.prototype.toString.call(function () {})'))
          .to.equal('function () {}');
        expect(runTranspiledCode('Function.prototype.toString.call(async function () {})'))
          .to.equal('async function () {}');
        expect(runTranspiledCode('Function.prototype.toString.call(function* () {})'))
          .to.equal('function* () {}');
        expect(runTranspiledCode('Function.prototype.toString.call(async function* () {})'))
          .to.equal('async function* () {}');
        expect(runTranspiledCode('Function.prototype.toString.call((class { method() {} }).prototype.method)'))
          .to.equal('method() {}');
      });

      it('lets us not worry about special characters', () => {
        expect(runTranspiledCode('Function.prototype.toString.call(() => {\n  method();\n})'))
          .to.equal('() => {\n    method();\n  }');
        expect(runTranspiledCode('Function.prototype.toString.call(() => { const 八 = 8; })'))
          .to.equal('() => {\n    const 八 = 8;\n  }');
      });
    });
  });

  context('error messages', () => {
    it('throws sensible error messages', () => {
      expect(() => runTranspiledCode('foo()'))
        .to.throw('foo is not defined');
      expect(() => runTranspiledCode('var foo = 0; foo()'))
        .to.throw('foo is not a function');
      expect(() => runTranspiledCode('Number.prototype()'))
        .to.throw('Number.prototype is not a function');
      expect(() => runTranspiledCode('(Number.prototype[0])()'))
        .to.throw('Number.prototype[0] is not a function');
      expect(() => runTranspiledCode('var db = {}; db.testx();'))
        .to.throw('db.testx is not a function');
      // (Note: The following ones would give better error messages in regular code)
      expect(() => runTranspiledCode('var db = {}; new Promise(db.foo)'))
        .to.throw('Promise resolver undefined is not a function');
      expect(() => runTranspiledCode('var db = {}; for (const a of db.foo) {}'))
        .to.throw(/undefined is not iterable/);
      expect(() => runTranspiledCode('var db = {}; for (const a of db[0]) {}'))
        .to.throw(/undefined is not iterable/);
      expect(() => runTranspiledCode('for (const a of 8) {}'))
        .to.throw('8 is not iterable');
    });

    it('throws sensible error message for code in IIFEs', async() => {
      expect(() => runTranspiledCode('(() => foo())()'))
        .to.throw('foo is not defined');
      expect(() => runTranspiledCode('(() => { var foo; foo(); })()'))
        .to.throw('foo is not a function');
      try {
        await runTranspiledCode('(async () => { var foo; foo(); })()');
        expect.fail('missed exception');
      } catch (err) {
        expect(err.message).to.equal('foo is not a function');
      }
    });

    it('throws sensible error messages for long expressions', () => {
      expect(() => runTranspiledCode('globalThis.abcdefghijklmnopqrstuvwxyz = {}; abcdefghijklmnopqrstuvwxyz()'))
        .to.throw('abcdefghijklm ... uvwxyz is not a function');
    });
  });

  context('domain support', () => {
    it('works fine when run inside a Node.js domain context', async() => {
      await execFile(process.execPath, [
        path.resolve(__dirname, '..', 'test', 'fixtures', 'with-domain.js')
      ], {
        timeout: 15_000
      });
    });
  });
});
