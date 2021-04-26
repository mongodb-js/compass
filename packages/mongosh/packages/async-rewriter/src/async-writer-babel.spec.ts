/* eslint dot-notation: 0 */
import { expect } from 'chai';
const sinon = require('sinon');
import traverse from '@babel/traverse';

const signatures = require('../test/shell-api-signatures');

import AsyncWriter, { assertUnreachable, checkHasAsyncChild } from './async-writer-babel';
import SymbolTable from './symbol-table';
import { AsyncRewriterErrors } from './error-codes';
import { MongoshInternalError, MongoshInvalidInputError, MongoshUnimplementedError } from '@mongosh/errors';

const skipPath = (p): any => {
  expect(Object.keys(p)).to.deep.equal([ 'type', 'returnsPromise', 'returnType', 'path' ]);
  return { returnType: p.returnType, returnsPromise: p.returnsPromise, type: p.type };
};
const myType = { type: 'myType', attributes: { myAttr: { type: 'unknown', attributes: {} } } };

function compileCheckScopes(writer, input) {
  const preDepth = writer.symbols.depth;
  const result = writer.compile(input);
  expect(writer.symbols.depth).to.equal(preDepth);
  return result;
}

describe('checkHasAsyncChild', () => {
  ['hasAsyncChild', 'returnsPromise'].forEach((key) => {
    it(`true deeply nested ${key}`, () => {
      const k = {
        inner: {
          inner2: {
            inner3: {
              inner4: {
              }
            }
          }
        }
      };
      k.inner.inner2.inner3.inner4[key] = true;
      expect(checkHasAsyncChild(k)).to.equal(true);
    });
    it(`false deeply nested ${key}`, () => {
      const k = {
        inner: {
          inner2: {
            inner3: {
              inner4: {
              }
            }
          }
        }
      };
      k.inner.inner2.inner3.inner4[key] = false;
      expect(checkHasAsyncChild(k)).to.equal(false);
    });
    it(`true top-level ${key}`, () => {
      const k = {};
      k[key] = true;
      expect(checkHasAsyncChild(k)).to.equal(true);
    });
    it(`false top-level ${key}`, () => {
      const k = {};
      k[key] = false;
      expect(checkHasAsyncChild(k)).to.equal(false);
    });
  });
  it('returns false when none', () => {
    expect(checkHasAsyncChild({})).to.equal(false);
    expect(checkHasAsyncChild({
      inner: {
        inner2: {
          inner3: {
            inner4: {
              notReturnsPromise: true
            }
          }
        }
      }
    })).to.equal(false);
  });
});
describe('assertUnreachable', () => {
  it('throws an error containing the type that failed', () => {
    try {
      assertUnreachable('AnExpression' as never);
    } catch (e) {
      expect(e).to.be.instanceOf(MongoshInternalError);
      expect(e.message).to.contain('type AnExpression unhandled');
    }
  });
});
describe('async-writer-babel', () => {
  let writer;
  let ast;
  let spy;
  let input;
  let output;
  describe('Identifier', () => {
    before(() => {
      writer = new AsyncWriter(signatures);
      writer.symbols.initializeApiObjects({ db: signatures.Database });
    });
    describe('with known type', () => {
      before(() => {
        input = 'db';
        ast = writer.getTransform(input).ast;
      });
      it('compiles correctly', () => {
        expect(compileCheckScopes(writer, input)).to.equal('db;');
      });
      it('decorates Identifier', (done) => {
        traverse(ast, {
          Identifier(path) {
            expect(path.node['shellType']).to.deep.equal(signatures.Database);
            done();
          }
        });
      });
    });
    describe('with unknown type', () => {
      before(() => {
        input = 'x';
        ast = writer.getTransform(input).ast;
      });
      it('compiles correctly', () => {
        expect(compileCheckScopes(writer, input)).to.equal('x;');
      });
      it('decorates Identifier', (done) => {
        traverse(ast, {
          Identifier(path) {
            expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
            done();
          }
        });
      });
    });
  });
  describe('TopLevelAwait', () => {
    before(() => {
      writer = new AsyncWriter(signatures);
      writer.symbols.initializeApiObjects({
        db: signatures.Database,
        c: signatures.Collection,
      });
      writer.symbols.add('t', { type: 'unknown', attributes: {} });
    });
    it('compiles db.coll.insertOne({})', () => {
      expect(writer.process('db.coll.insertOne({})'))
        .to.equal('(async () => {\nreturn (await db.coll.insertOne({}));\n})()');
    });
    it('compiles async function within a function', () => {
      expect(writer.process('function fn() { db.coll.insertOne({}); }'))
        .to.equal('async function fn() {\n  await db.coll.insertOne({});\n}');
    });
    it('compiles variable declarations', () => {
      expect(writer.process('db.coll.insertOne({}); var a = "foo";'))
        .to.equal('(async () => {\nawait db.coll.insertOne({});\nvoid (a = "foo");\n})()');
      expect(writer.process('db.coll.insertOne({}); var b;'))
        .to.equal('(async () => {\nawait db.coll.insertOne({});\nvoid (b=undefined);\n})()');
      expect(writer.process('db.coll.insertOne({}); var q=0,p=1;'))
        .to.equal('(async () => {\nawait db.coll.insertOne({});\nvoid ( (q = 0),\n    (p = 1));\n})()');
    });
    it('does not add TLA if there is a return statement', () => {
      expect(writer.process('(() => { db.coll.insertOne({}); return; var a = "foo"; })()'))
        .to.include('var a = "foo"');
    });
    it('compiles async function within a class function', () => {
      const i = `
class Test {
  regularFn() { return db; }
  awaitFn() { db.coll.insertOne({}) }
};`;
      expect(writer.process(i)).to.equal(`class Test {
  regularFn() {
    return db;
  }

  async awaitFn() {
    await db.coll.insertOne({});
  }

}

;`);
    });
    it('compiles forEach with top-level variable calling a function and returning', () => {
      const code = `
var names = ['Angela', 'Barack', 'Charles'];
function insertDoc(name) {
  db.coll.insertOne({ name });
}
names.forEach(n => insertDoc(n));
(names.length);
`;
      expect(writer.process(code)).to.equal(`(async () => {
void (names = ['Angela', 'Barack', 'Charles']);

insertDoc=async function insertDoc(name) {
  await db.coll.insertOne({
    name
  });
}

await toIterator(names).forEach(async n => await insertDoc(n));
return (names.length);
})()`);
    });
  });
  describe('MemberExpression', () => {
    describe('with Identifier lhs', () => {
      before(() => {
        writer = new AsyncWriter(signatures);
        writer.symbols.initializeApiObjects({
          db: signatures.Database,
          coll: signatures.Collection,
          c: signatures.Cursor
        });
        writer.symbols.add('t', { type: 'unknown', attributes: {} });
      });
      describe('dot notation', () => {
        describe('with Database lhs type', () => {
          before(() => {
            input = 'db.coll';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('db.coll;');
          });
          it('decorates node.object Identifier', (done) => {
            traverse(ast, {
              Identifier(path) {
                if (path.node.name === 'db') {
                  expect(path.node['shellType']).to.deep.equal(signatures.Database);
                  done();
                }
              }
            });
          });
          it('decorates node.key Identifier', (done) => { // NOTE: if this ID exists in scope will be descorated with that value not undefined.
            traverse(ast, {
              Identifier(path) {
                if (path.node.name === 'coll') {
                  expect(path.node['shellType']).to.deep.equal(signatures.Collection);
                  done();
                }
              }
            });
          });
          it('decorates MemberExpression', (done) => {
            traverse(ast, {
              MemberExpression(path) {
                expect(path.node['shellType']).to.deep.equal(signatures.Collection);
                done();
              }
            });
          });
        });
        describe('with Collection lhs type', () => {
          before(() => {
            input = 'coll.coll2';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('coll.coll2;');
          });
          it('decorates node.object Identifier', (done) => {
            traverse(ast, {
              Identifier(path) {
                if (path.node.name === 'coll') {
                  expect(path.node['shellType']).to.deep.equal(signatures.Collection);
                  done();
                }
              }
            });
          });
          it('decorates node.key Identifier', (done) => { // NOTE: if this ID exists in scope will be decorated with that value not undefined.
            traverse(ast, {
              Identifier(path) {
                if (path.node.name === 'coll2') {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              }
            });
          });
          it('decorates MemberExpression', (done) => {
            traverse(ast, {
              MemberExpression(path) {
                expect(path.node['shellType']).to.deep.equal(signatures.Collection);
                done();
              }
            });
          });
        });
        describe('with non-Database known lhs type', () => {
          describe('with known rhs', () => {
            before(() => {
              input = 'c.hasNext';
              ast = writer.getTransform(input).ast;
            });
            it('compiles correctly', () => {
              expect(compileCheckScopes(writer, input)).to.equal('c.hasNext;');
            });
            it('decorates node.object Identifier', (done) => {
              traverse(ast, {
                Identifier(path) {
                  if (path.node.name === 'c') {
                    expect(path.node['shellType']).to.deep.equal(signatures.Cursor);
                    done();
                  }
                }
              });
            });
            it('decorates node.key Identifier', (done) => {
              traverse(ast, {
                Identifier(path) {
                  if (path.node.name === 'hasNext') {
                    expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                    done();
                  }
                }
              });
            });
            it('decorates MemberExpression', (done) => {
              traverse(ast, {
                MemberExpression(path) {
                  expect(path.node['shellType']).to.deep.equal(signatures.Cursor.attributes.hasNext);
                  done();
                }
              });
            });
          });
          describe('with unknown rhs', () => {
            before(() => {
              input = 'c.x';
              ast = writer.getTransform(input).ast;
            });
            it('compiles correctly', () => {
              expect(compileCheckScopes(writer, input)).to.equal('c.x;');
            });
            it('decorates node.object Identifier', (done) => {
              traverse(ast, {
                Identifier(path) {
                  if (path.node.name === 'c') {
                    expect(path.node['shellType']).to.deep.equal(signatures.Cursor);
                    done();
                  }
                }
              });
            });
            it('decorates node.key Identifier', (done) => {
              traverse(ast, {
                Identifier(path) {
                  if (path.node.name === 'x') {
                    expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                    done();
                  }
                }
              });
            });
            it('decorates MemberExpression', (done) => {
              traverse(ast, {
                MemberExpression(path) {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              });
            });
          });
        });
        describe('with unknown lhs type', () => {
          before(() => {
            input = 'x.coll2';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('x.coll2;');
          });
          it('decorates node.object Identifier', (done) => {
            traverse(ast, {
              Identifier(path) {
                if (path.node.name === 'x') {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              }
            });
          });
          it('decorates node.key Identifier', (done) => {
            traverse(ast, {
              Identifier(path) {
                if (path.node.name === 'coll2') {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              }
            });
          });
          it('decorates MemberExpression', (done) => {
            traverse(ast, {
              MemberExpression(path) {
                expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                done();
              }
            });
          });
        });
        describe('db.system.profile', () => {
          before(() => {
            input = 'db.system.profile.insertOne({})';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('await db.system.profile.insertOne({});');
          });
          it('decorates node.object Identifier', (done) => {
            traverse(ast, {
              Identifier(path) {
                if (path.node.name === 'db') {
                  expect(path.node['shellType']).to.deep.equal(signatures.Database);
                  done();
                }
                if (path.node.name === 'system') {
                  expect(path.node['shellType']).to.deep.equal(signatures.Collection);
                  done();
                }
                if (path.node.name === 'profile') {
                  expect(path.node['shellType']).to.deep.equal(signatures.Collection);
                  done();
                }
              }
            });
          });
          it('decorates MemberExpression', () => {
            traverse(ast, {
              MemberExpression(path) {
                expect(['Collection', 'function']).to.include(path.node['shellType'].type);
              }
            });
          });
        });
      });
      describe('bracket notation', () => {
        describe('literal property', () => {
          before(() => {
            input = 'c[\'hasNext\']';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('c[\'hasNext\'];');
          });
          it('decorates node.object Identifier', (done) => {
            traverse(ast, {
              Identifier(path) {
                if (path.node.name === 'c') {
                  expect(path.node['shellType']).to.deep.equal(signatures.Cursor);
                  done();
                }
              }
            });
          });
          it('decorates node.key Literal', (done) => {
            traverse(ast, {
              StringLiteral(path) {
                if (path.node.value === 'hasNext') {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              }
            });
          });
          it('decorates MemberExpression', (done) => {
            traverse(ast, {
              MemberExpression(path) {
                expect(path.node['shellType']).to.deep.equal(signatures.Cursor.attributes.hasNext);
                done();
              }
            });
          });
        });
        describe('computed property', () => {
          describe('when lhs has async child', () => {
            it('throws an error', () => {
              try {
                compileCheckScopes(writer, 'c[(x)]');
              } catch (e) {
                expect(e.name).to.be.equal('MongoshInvalidInputError');
                expect(e.message).to.not.contain('Database');
                expect(e.code).to.be.equal(AsyncRewriterErrors.DynamicAccessOfApiType);
              }
            });
            it('throws an error with suggestion for db', () => {
              try {
                compileCheckScopes(writer, 'db[x()]');
              } catch (e) {
                expect(e.name).to.be.equal('MongoshInvalidInputError');
                expect(e.message).to.contain('Database');
                expect(e.code).to.be.equal(AsyncRewriterErrors.DynamicAccessOfApiType);
              }
            });
          });
          describe('when lhs has no async child', () => {
            before(() => {
              input = 't[x()]';
              ast = writer.getTransform(input).ast;
            });
            it('compiles correctly', () => {
              expect(compileCheckScopes(writer, input)).to.equal('t[x()];');
            });
            it('decorates node.object Identifier', (done) => {
              traverse(ast, {
                Identifier(path) {
                  if (path.node.name === 't') {
                    expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                    done();
                  }
                }
              });
            });
            it('decorates node.key CallExpression', (done) => {
              traverse(ast, {
                CallExpression(path) {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              });
            });
            it('decorates MemberExpression', (done) => {
              traverse(ast, {
                MemberExpression(path) {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              });
            });
          });
        });
      });
    });
    describe('with Object lhs', () => {
      before(() => {
        writer = new AsyncWriter(signatures);
        writer.symbols.initializeApiObjects({
          db: signatures.Database,
        });
        compileCheckScopes(writer, 'a = { d: db }');
      });
      describe('dot notation', () => {
        before(() => {
          input = 'a.d';
          ast = writer.getTransform(input).ast;
        });
        it('compiles correctly', () => {
          expect(compileCheckScopes(writer, input)).to.equal('a.d;');
        });
        it('decorates node.object Identifier', (done) => {
          traverse(ast, {
            Identifier(path) {
              expect(path.node['shellType']).to.deep.equal({
                type: 'object',
                attributes: { d: signatures.Database },
                hasAsyncChild: true
              });
              done();
            }
          });
        });
        it('decorates node.key Identifier', (done) => { // NOTE: if this ID exists in scope will be descorated with that value not undefined.
          traverse(ast, {
            Identifier(path) {
              if (path.node.name === 'd') {
                expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                done();
              }
            }
          });
        });
        it('decorates MemberExpression', (done) => {
          traverse(ast, {
            MemberExpression(path) {
              expect(path.node['shellType']).to.deep.equal(signatures.Database);
              done();
            }
          });
        });
      });
      describe('bracket notation', () => {
        describe('with string', () => {
          before(() => {
            input = 'a[\'d\']';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('a[\'d\'];');
          });
          it('decorates node.object Identifier', (done) => {
            traverse(ast, {
              Identifier(path) {
                expect(path.node['shellType']).to.deep.equal({
                  type: 'object',
                  attributes: { d: signatures.Database },
                  hasAsyncChild: true
                });
                done();
              }
            });
          });
          it('decorates MemberExpression', (done) => {
            traverse(ast, {
              MemberExpression(path) {
                expect(path.node['shellType']).to.deep.equal(signatures.Database);
                done();
              }
            });
          });
        });
        describe('with other rhs', () => {
          it('throws an error for computed identifier', () => {
            try {
              compileCheckScopes(writer, 'a[d]');
            } catch (e) {
              expect(e.name).to.be.equal('MongoshInvalidInputError');
              expect(e.message).to.not.contain('try Database.get');
              expect(e.code).to.be.equal(AsyncRewriterErrors.DynamicAccessOfApiType);
            }
          });
          it('throws an error for null', () => {
            try {
              compileCheckScopes(writer, 'a[null]');
            } catch (e) {
              expect(e.name).to.be.equal('MongoshInvalidInputError');
              expect(e.message).to.not.contain('try Database.get');
              expect(e.code).to.be.equal(AsyncRewriterErrors.DynamicAccessOfApiType);
            }
          });
          it('throws an error with db suggestion', () => {
            try {
              compileCheckScopes(writer, 'a.d[coll]');
            } catch (e) {
              expect(e.name).to.be.equal('MongoshInvalidInputError');
              expect(e.message).to.contain('try Database.get');
              expect(e.code).to.be.equal(AsyncRewriterErrors.DynamicAccessOfApiType);
            }
          });
        });
      });
    });
    describe('with Array lhs', () => {
      before(() => {
        writer = new AsyncWriter(signatures);
        writer.symbols.initializeApiObjects({
          db: signatures.Database,
        });
        compileCheckScopes(writer, 'a = [db]');
      });
      describe('with literal index', () => {
        before(() => {
          input = 'a[0]';
          ast = writer.getTransform(input).ast;
        });
        it('compiles correctly', () => {
          expect(compileCheckScopes(writer, input)).to.equal('a[0];');
        });
        it('decorates node.object Identifier', (done) => {
          traverse(ast, {
            Identifier(path) {
              expect(path.node['shellType']).to.deep.equal({
                type: 'array',
                attributes: { '0': signatures.Database },
                hasAsyncChild: true
              });
              done();
            }
          });
        });
        it('decorates MemberExpression', (done) => {
          traverse(ast, {
            MemberExpression(path) {
              expect(path.node['shellType']).to.deep.equal(signatures.Database);
              done();
            }
          });
        });
      });
      describe('with variable', () => {
        it('throws an error since has async child', () => {
          try {
            compileCheckScopes(writer, 'a[d]');
          } catch (e) {
            expect(e.name).to.be.equal('MongoshInvalidInputError');
            expect(e.message).to.not.contain('Database');
            expect(e.code).to.be.equal(AsyncRewriterErrors.DynamicAccessOfApiType);
          }
        });
      });
    });
  });
  describe('ObjectExpression', () => {
    before(() => {
      writer = new AsyncWriter(signatures);
      writer.symbols.initializeApiObjects({
        db: signatures.Database,
      });
    });
    describe('with known type', () => {
      before(() => {
        input = 'a = {x: db}';
        ast = writer.getTransform(input).ast;
      });
      it('compiles correctly', () => {
        expect(compileCheckScopes(writer, input)).to.equal('a = {\n  x: db\n};');
      });
      it('decorates object', (done) => {
        traverse(ast, {
          ObjectExpression(path) {
            expect(path.node['shellType']).to.deep.equal({
              type: 'object',
              attributes: { x: signatures.Database },
              hasAsyncChild: true
            });
            done();
          }
        });
      });
      it('decorates element', (done) => {
        traverse(ast, {
          Property(path) {
            expect(path.node.value['shellType']).to.deep.equal(signatures.Database);
            done();
          }
        });
      });
    });
    describe('with unknown type', () => {
      before(() => {
        input = 'a = {x: y}';
        ast = writer.getTransform(input).ast;
      });
      it('compiles correctly', () => {
        expect(compileCheckScopes(writer, input)).to.equal('a = {\n  x: y\n};');
      });
      it('decorates object', (done) => {
        traverse(ast, {
          ObjectExpression(path) {
            expect(path.node['shellType']).to.deep.equal({
              type: 'object',
              attributes: { x: { type: 'unknown', attributes: {} } },
              hasAsyncChild: false
            });
            done();
          }
        });
      });
      it('decorates element', (done) => {
        traverse(ast, {
          Property(path) {
            expect(path.node.value['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
            done();
          }
        });
      });
    });
    describe('with methods', () => {
      describe('no async', () => {
        before(() => {
          input = 'a = { method() { return 1; }}';
          ast = writer.getTransform(input).ast;
        });
        it('compiles correctly', () => {
          expect(compileCheckScopes(writer, input)).to.equal('a = {\n  method() {\n    return 1;\n  }\n\n};');
        });
        it('decorates object', (done) => {
          traverse(ast, {
            ObjectExpression(path) {
              expect(path.node['shellType'].type).to.equal('object');
              expect(path.node['shellType'].hasAsyncChild).to.equal(false);
              expect(Object.keys(path.node['shellType'].attributes)).to.deep.equal(['method']);
              expect(skipPath(path.node['shellType'].attributes.method)).to.deep.equal({
                type: 'function', returnType: { type: 'unknown', attributes: {} }, returnsPromise: false
              });
              done();
            }
          });
        });
      });
      describe('with async', () => {
        before(() => {
          input = 'a = { method() { return db; }}';
          ast = writer.getTransform(input).ast;
        });
        it('compiles correctly', () => {
          expect(compileCheckScopes(writer, input)).to.equal('a = {\n  method() {\n    return db;\n  }\n\n};');
        });
        it('decorates object', (done) => {
          traverse(ast, {
            ObjectExpression(path) {
              expect(path.node['shellType'].type).to.equal('object');
              expect(path.node['shellType'].hasAsyncChild).to.equal(true);
              expect(Object.keys(path.node['shellType'].attributes)).to.deep.equal(['method']);
              expect(skipPath(path.node['shellType'].attributes.method)).to.deep.equal({
                type: 'function', returnType: signatures.Database, returnsPromise: false
              });
              done();
            }
          });
        });
      });
    });
    describe('with spread', () => {
      describe('with known identifier', () => {
        before(() => {
          compileCheckScopes(writer, 'oldObj = { method() { return db; }}');
          input = 'newObj = {...oldObj}';
          ast = writer.getTransform(input).ast;
        });
        it('compiles correctly', () => {
          expect(compileCheckScopes(writer, input)).to.equal('newObj = { ...oldObj\n};');
        });
        it('decorates object', (done) => {
          traverse(ast, {
            ObjectExpression(path) {
              expect(path.node['shellType'].type).to.equal('object');
              expect(path.node['shellType'].hasAsyncChild).to.equal(true);
              expect(Object.keys(path.node['shellType'].attributes)).to.deep.equal(['method']);
              expect(skipPath(path.node['shellType'].attributes.method)).to.deep.equal({
                type: 'function', returnType: signatures.Database, returnsPromise: false
              });
              done();
            }
          });
        });
      });
      describe('with unknown identifier', () => {
        before(() => {
          input = 'newObj = {...unknownObj}';
          ast = writer.getTransform(input).ast;
        });
        it('compiles correctly', () => {
          expect(compileCheckScopes(writer, input)).to.equal('newObj = { ...unknownObj\n};');
        });
        it('decorates object', (done) => {
          traverse(ast, {
            ObjectExpression(path) {
              expect(path.node['shellType'].type).to.equal('object');
              expect(path.node['shellType'].hasAsyncChild).to.equal(false);
              expect(Object.keys(path.node['shellType'].attributes)).to.deep.equal([]);
              done();
            }
          });
        });
      });
    });
    describe('with literal', () => {
      before(() => {
        input = 'newObj = {...{ method() { return db; }}}';
        ast = writer.getTransform(input).ast;
      });
      it('compiles correctly', () => {
        expect(compileCheckScopes(writer, input)).to.equal('newObj = { ...{\n    method() {\n      return db;\n    }\n\n  }\n};');
      });
      it('decorates object', () => {
        const node = ast.program.body[0].expression.right;
        expect(node['shellType'].type).to.equal('object');
        expect(node['shellType'].hasAsyncChild).to.equal(true);
        expect(Object.keys(node['shellType'].attributes)).to.deep.equal(['method']);
        expect(skipPath(node['shellType'].attributes.method)).to.deep.equal({
          type: 'function', returnType: signatures.Database, returnsPromise: false
        });
      });
    });
  });
  describe('ArrayExpression', () => {
    before(() => {
      writer = new AsyncWriter(signatures);
      writer.symbols.initializeApiObjects({
        db: signatures.Database,
      });
    });
    describe('with known simple type', () => {
      before(() => {
        input = '[db]';
        ast = writer.getTransform(input).ast;
      });
      it('compiles correctly', () => {
        expect(compileCheckScopes(writer, input)).to.equal('[db];');
      });
      it('decorates array', (done) => {
        traverse(ast, {
          ArrayExpression(path) {
            expect(path.node['shellType']).to.deep.equal({
              type: 'array',
              attributes: { '0': signatures.Database },
              hasAsyncChild: true
            });
            done();
          }
        });
      });
      it('decorates element', (done) => {
        traverse(ast, {
          Identifier(path) {
            expect(path.node['shellType']).to.deep.equal(signatures.Database);
            done();
          }
        });
      });
    });
    describe('with known function return type', () => {
      before(() => {
        input = '[function callMe() { return db; }]';
        ast = writer.getTransform(input).ast;
      });
      it('compiles correctly', () => {
        expect(compileCheckScopes(writer, input)).to.equal('[function callMe() {\n  return db;\n}];');
      });
      it('decorates array', (done) => {
        traverse(ast, {
          ArrayExpression(path) {
            expect(path.node['shellType']).to.include({
              type: 'array',
              hasAsyncChild: true
            });
            expect(path.node['shellType'].attributes['0']).to.include({
              type: 'function',
              returnsPromise: false
            });
            expect(path.node['shellType'].attributes['0'].returnType).to.deep.equal(signatures.Database);
            done();
          }
        });
      });
      it('decorates element', (done) => {
        traverse(ast, {
          FunctionExpression(path) {
            expect(path.node['shellType']).to.include({
              type: 'function',
              returnsPromise: false
            });
            expect(path.node['shellType'].returnType).to.deep.equal(signatures.Database);
            done();
          }
        });
      });
    });
    describe('with unknown type', () => {
      before(() => {
        input = '[x]';
        ast = writer.getTransform(input).ast;
      });
      it('compiles correctly', () => {
        expect(compileCheckScopes(writer, input)).to.equal('[x];');
      });
      it('decorates array', (done) => {
        traverse(ast, {
          ArrayExpression(path) {
            expect(path.node['shellType']).to.deep.equal({
              type: 'array',
              attributes: { '0': { type: 'unknown', attributes: {} } },
              hasAsyncChild: false
            });
            done();
          }
        });
      });
      it('decorates element', (done) => {
        traverse(ast, {
          Identifier(path) {
            expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
            done();
          }
        });
      });
    });
    describe('with empty items in array', () => {
      before(() => {
        input = '[1,,3]';
        ast = writer.getTransform(input).ast;
      });
      it('compiles correctly', () => {
        expect(compileCheckScopes(writer, input)).to.equal('[1,, 3];');
      });
    });
  });
  describe('CallExpression', () => {
    describe('with unknown callee', () => {
      before(() => {
        writer = new AsyncWriter(signatures);
        writer.symbols.initializeApiObjects({
          t: { type: 'unknown', attributes: {} },
        });
        input = 'x()';
        ast = writer.getTransform(input).ast;
      });
      it('compiles correctly', () => {
        expect(compileCheckScopes(writer, input)).to.equal('x();');
      });
      it('decorates CallExpression', (done) => {
        traverse(ast, {
          CallExpression(path) {
            expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
            done();
          }
        });
      });
    });
    describe('with known callee', () => {
      describe('that requires await', () => {
        describe('tracks returnType correctly', () => {
          before(() => {
            writer = new AsyncWriter(signatures);
            writer.symbols.initializeApiObjects({
              db: signatures.Database
            });
            expect(compileCheckScopes(writer, 'async function returnsAgg() { return db.coll.aggregate(); }')).to.equal(
              'async function returnsAgg() {\n  return await db.coll.aggregate();\n}'
            );
          });
          it('compiles correctly', () => {
            input = 'function callsReturnsAgg() { return returnsAgg(); }';
            expect(compileCheckScopes(writer, input)).to.equal('async function callsReturnsAgg() {\n  return await returnsAgg();\n}');
          });
          it('decorates correctly', (done) => {
            const finalCall = 'callsReturnsAgg()';
            ast = writer.getTransform(finalCall).ast;
            expect(compileCheckScopes(writer, finalCall)).to.equal('await callsReturnsAgg();');
            traverse(ast, {
              CallExpression(path) {
                expect(path.node['shellType'].type).to.deep.equal('AggregationCursor');
                done();
              }
            });
          });
        });
        describe('is async and is rewritten', () => {
          before(() => {
            writer = new AsyncWriter(signatures);
            writer.symbols.initializeApiObjects({
              reqAwait: { type: 'function', returnsPromise: true }
            });
            expect(compileCheckScopes(writer, 'async function yesAwait() { reqAwait(); }')).to.equal(
              'async function yesAwait() {\n  await reqAwait();\n}'
            );
            input = 'yesAwait()';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('await yesAwait();');
          });
          it('decorates CallExpression', (done) => {
            traverse(ast, {
              CallExpression(path) {
                expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                done();
              }
            });
          });
        });
        describe('returnType undefined', () => {
          before(() => {
            writer = new AsyncWriter(signatures);
            writer.symbols.initializeApiObjects({
              reqAwait: { type: 'function', returnsPromise: true }
            });
            input = 'reqAwait()';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('await reqAwait();');
          });
          it('decorates CallExpression', (done) => {
            traverse(ast, {
              CallExpression(path) {
                expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                done();
              }
            });
          });
        });
        describe('returnType string', () => {
          before(() => {
            writer = new AsyncWriter(signatures);
            writer.symbols.initializeApiObjects({
              reqAwait: { type: 'function', returnsPromise: true, returnType: 'Collection' }
            });
            input = 'reqAwait()';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('await reqAwait();');
          });
          it('decorates CallExpression', (done) => {
            traverse(ast, {
              CallExpression(path) {
                expect(path.node['shellType']).to.deep.equal(signatures.Collection);
                done();
              }
            });
          });
        });
        describe('returnType {}', () => {
          before(() => {
            writer = new AsyncWriter(signatures);
            writer.symbols.initializeApiObjects({
              reqAwait: { type: 'function', returnsPromise: true, returnType: { type: 'new' } }
            });
            input = 'reqAwait()';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('await reqAwait();');
          });
          it('decorates CallExpression', (done) => {
            traverse(ast, {
              CallExpression(path) {
                expect(path.node['shellType']).to.deep.equal({ type: 'new' });
                done();
              }
            });
          });
        });
        describe('with call nested as argument', () => {
          before(() => {
            writer = new AsyncWriter(signatures);
            writer.symbols.initializeApiObjects({
              reqAwait: { type: 'function', returnsPromise: true, returnType: { type: 'new' } }
            });
            input = 'reqAwait(reqAwait())';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('await reqAwait((await reqAwait()));');
          });
        });
      });
      describe('that does not require await', () => {
        describe('is originally async and so not rewritten', () => {
          before(() => {
            writer = new AsyncWriter(signatures);
            writer.symbols.initializeApiObjects({});
            compileCheckScopes(writer, 'async function noAwait() { return 1; }');
            input = 'noAwait()';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('noAwait();');
          });
          it('decorates CallExpression', (done) => {
            traverse(ast, {
              CallExpression(path) {
                expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                done();
              }
            });
          });
        });
        describe('returnType undefined', () => {
          before(() => {
            writer = new AsyncWriter(signatures);
            writer.symbols.initializeApiObjects({
              noAwait: { type: 'function', returnsPromise: false }
            });
            input = 'noAwait()';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('noAwait();');
          });
          it('decorates CallExpression', (done) => {
            traverse(ast, {
              CallExpression(path) {
                expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                done();
              }
            });
          });
        });
        describe('returnType string', () => {
          before(() => {
            writer = new AsyncWriter(signatures);
            writer.symbols.initializeApiObjects({
              noAwait: { type: 'function', returnsPromise: false, returnType: 'Collection' }
            });
            input = 'noAwait()';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('noAwait();');
          });
          it('decorates CallExpression', (done) => {
            traverse(ast, {
              CallExpression(path) {
                expect(path.node['shellType']).to.deep.equal(signatures.Collection);
                done();
              }
            });
          });
        });
        describe('returnType {}', () => {
          before(() => {
            writer = new AsyncWriter(signatures);
            writer.symbols.initializeApiObjects({
              noAwait: { type: 'function', returnsPromise: false, returnType: { type: 'new' } }
            });
            input = 'noAwait()';
            ast = writer.getTransform(input).ast;
          });
          it('compiles correctly', () => {
            expect(compileCheckScopes(writer, input)).to.equal('noAwait();');
          });
          it('decorates CallExpression', (done) => {
            traverse(ast, {
              CallExpression(path) {
                expect(path.node['shellType']).to.deep.equal({ type: 'new' });
                done();
              }
            });
          });
        });
      });
    });
    describe('with shell API type as argument', () => {
      before(() => {
        writer = new AsyncWriter(signatures);
        writer.symbols.initializeApiObjects({
          db: signatures.Database
        });
      });
      it('throws an error for db', () => {
        try {
          compileCheckScopes(writer, 'fn(db)');
        } catch (e) {
          expect(e.name).to.be.equal('MongoshInvalidInputError');
          expect(e.code).to.be.equal(AsyncRewriterErrors.ApiTypeAsFunctionArgument);
        }
      });
      it('ignores exceptions', () => {
        expect(compileCheckScopes(writer, 'print(db)')).to.equal('print(db);');
        expect(compileCheckScopes(writer, 'printjson(db)')).to.equal('printjson(db);');
      });
      it('throws an error for db.coll', () => {
        try {
          compileCheckScopes(writer, 'fn(db.coll)');
        } catch (e) {
          expect(e.name).to.be.equal('MongoshInvalidInputError');
          expect(e.code).to.be.equal(AsyncRewriterErrors.ApiTypeAsFunctionArgument);
        }
      });
      it('throws an error for db.coll.insertOne', () => {
        try {
          compileCheckScopes(writer, 'fn(db.coll.insertOne)');
        } catch (e) {
          expect(e.name).to.be.equal('MongoshInvalidInputError');
          expect(e.code).to.be.equal(AsyncRewriterErrors.ApiTypeAsFunctionArgument);
        }
      });
      it('throws an error for async method', () => {
        compileCheckScopes(writer, 'function f() { db.coll.insertOne({}) }');
        try {
          compileCheckScopes(writer, 'fb(f)');
        } catch (e) {
          expect(e.name).to.be.equal('MongoshInvalidInputError');
          expect(e.code).to.be.equal(AsyncRewriterErrors.ApiTypeAsFunctionArgument);
        }
      });
      it('does not throw error for regular arg', () => {
        expect(compileCheckScopes(writer, 'fn(1, 2, db.coll.find)')).to.equal('fn(1, 2, db.coll.find);');
      });
    });
    describe('updates outer scope when called', () => {
      before(() => {
        spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
        writer = new AsyncWriter(signatures, spy);
        const result = writer.getTransform(input);
        output = result.code;
      });
      it('sets pre format', () => {
        compileCheckScopes(writer, `
var a = db;
function f() {
  a = 1;
}`);
        expect(spy.lookup('a')).to.deep.equal(signatures.Database);
      });
      it('updates symbol table when called', () => {
        compileCheckScopes(writer, 'f()');
        expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
      });
    });
    describe('LHS is function', () => {
      before(() => {
        spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
        writer = new AsyncWriter(signatures, spy);
        input = 'a = (() => (db))()';
        ast = writer.getTransform(input).ast;
      });
      it('compiles correctly', () => {
        expect(compileCheckScopes(writer, input)).to.equal('a = (() => db)();');
      });
      it('updates symbol table', () => {
        expect(spy.lookup('a')).to.deep.equal(signatures.Database);
      });
    });
  });
  describe('VariableDeclarator', () => {
    describe('non-symbol lval', () => {
      before(() => {
        spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
        writer = new AsyncWriter(signatures, spy);
        input = 'a = (() => (db))()';
        ast = writer.getTransform(input).ast;
      });
      it('array pattern throws for async type', () => {
        try {
          compileCheckScopes(writer, 'let [a, b] = [1, db]');
        } catch (e) {
          expect(e.name).to.be.equal('MongoshUnimplementedError');
          expect(e.code).to.be.equal(AsyncRewriterErrors.DestructuringNotImplemented);
        }
      });
      it('array pattern ignored for non-async', () => {
        expect(compileCheckScopes(writer, 'let [a, b] = [1, 2]')).to.equal('let [a, b] = [1, 2];');
      });
      it('object pattern throws for async type', () => {
        try {
          compileCheckScopes(writer, 'let {a} = {a: db}');
        } catch (e) {
          expect(e.name).to.be.equal('MongoshUnimplementedError');
          expect(e.code).to.be.equal(AsyncRewriterErrors.DestructuringNotImplemented);
        }
      });
      it('object pattern ignored for non-async', () => {
        expect(compileCheckScopes(writer, 'let {a} = {a: 1, b: 2}')).to.equal('let {\n  a\n} = {\n  a: 1,\n  b: 2\n};');
      });
    });
    describe('var', () => {
      describe('top-level', () => {
        describe('without assignment', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{}, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            input = 'var x';
            const result = writer.getTransform(input);
            ast = result.ast;
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('var x;');
          });
          it('decorates VariableDeclarator', (done) => {
            traverse(ast, {
              VariableDeclarator(path) {
                expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                done();
              }
            });
          });
          it('adds to symbol table', () => {
            expect(spy.add.calledOnce).to.be.false;
            expect(spy.scopeAt(1)).to.deep.equal({ x: { type: 'unknown', attributes: {} } });
          });
        });
        describe('with assignment', () => {
          describe('rhs is unknown type', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{}, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              input = 'var x = 1';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('var x = 1;');
            });
            it('decorates VariableDeclarator', (done) => {
              traverse(ast, {
                VariableDeclarator(path) {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              });
            });
            it('adds to symbol table', () => {
              expect(spy.add.calledOnce).to.be.false;
              expect(spy.scopeAt(1)).to.deep.equal({ x: { type: 'unknown', attributes: {} } });
            });
          });
          describe('rhs is known type', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              input = 'var x = db';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('var x = db;');
            });
            it('decorates VariableDeclarator', (done) => {
              traverse(ast, {
                VariableDeclarator(path) {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              });
            });
            it('adds to symbol table', () => {
              expect(spy.add.calledOnce).to.be.false;
              expect(spy.scopeAt(1)).to.deep.equal({ x: signatures.Database });
            });
          });
        });
        describe('redefine existing variable', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{}, { v: myType }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            input = 'var v = 1';
            const result = writer.getTransform(input);
            ast = result.ast;
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('var v = 1;');
          });
          it('adds to symbol table', () => {
            expect(spy.add.calledOnce).to.be.false;
            expect(spy.scopeAt(1)).to.deep.equal({ v: { type: 'unknown', attributes: {} } });
          });
        });
      });
      describe('inside function scope', () => {
        const type = { returnType: { type: 'unknown', attributes: {} }, returnsPromise: false, type: 'function' };
        before(() => {
          spy = sinon.spy(new SymbolTable([ { db: signatures.Database }, {} ], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = 'function f() { var x = db; }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('function f() {\n  var x = db;\n}');
        });
        it('adds to symbol table', () => {
          expect(spy.updateFunctionScoped.calledOnce).to.be.true;
          const calls = spy.updateFunctionScoped.getCall(0);
          expect(calls.args[1]).to.equal('f');
          expect(skipPath(calls.args[2])).to.deep.equal(type);
          expect(Object.keys(spy.scopeAt(1))).to.deep.equal(['f']);
        });
      });
      describe('inside block scope', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([ { db: signatures.Database }, {} ], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = '{ var x = db; }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('{\n  var x = db;\n}');
        });
        it('adds to symbol table', () => {
          expect(spy.add.calledOnce).to.be.false;
          expect(spy.scopeAt(1)).to.deep.equal({ x: signatures.Database }); // var hoisted to top
        });
      });
    });
    describe('const', () => {
      describe('top-level', () => {
        describe('with assignment', () => {
          describe('rhs is unknown type', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{}, {}], signatures));
              writer = writer = new AsyncWriter(signatures, spy);
              input = 'const x = 1';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('const x = 1;');
            });
            it('adds to symbol table', () => {
              expect(spy.add.calledOnce).to.be.true;
              expect(spy.add.getCall(0).args).to.deep.equal(['x', { type: 'unknown', attributes: {} }]);
              expect(spy.scopeAt(1)).to.deep.equal({ x: { type: 'unknown', attributes: {} } });
            });
          });
          describe('rhs is known type', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              input = 'const x = db';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('const x = db;');
            });
            it('adds to symbol table', () => {
              expect(spy.add.calledOnce).to.be.true;
              expect(spy.add.getCall(0).args).to.deep.equal(['x', signatures.Database]);
              expect(spy.scopeAt(1)).to.deep.equal({ x: signatures.Database });
            });
          });
        });
        describe('redefine existing variable', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, { myVar: myType }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            input = 'const myVar = 1';
            const result = writer.getTransform(input);
            ast = result.ast;
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('const myVar = 1;');
          });
          it('adds to symbol table', () => {
            expect(spy.add.calledOnce).to.be.true;
            expect(spy.add.getCall(0).args).to.deep.equal(['myVar', { type: 'unknown', attributes: {} }]);
            expect(spy.scopeAt(2)).to.deep.equal({ myVar: { type: 'unknown', attributes: {} } });
          });
        });
      });
      describe('inside function scope', () => {
        const type = { returnType: { type: 'unknown', attributes: {} }, returnsPromise: false, type: 'function' };
        before(() => {
          spy = sinon.spy(new SymbolTable([ { db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = 'function f() { const x = db; }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('function f() {\n  const x = db;\n}');
        });
        it('adds to symbol table', () => {
          const calls = spy.updateFunctionScoped.getCall(0);
          expect(calls.args[1]).to.equal('f');
          expect(skipPath(calls.args[2])).to.deep.equal(type);
          expect(Object.keys(spy.scopeAt(1))).to.deep.equal(['f']); // var hoisted only to function
        });
      });
      describe('inside block scope', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([ { db: signatures.Database }, {} ], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = '{ const x = db; }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('{\n  const x = db;\n}');
        });
        it('adds to symbol table', () => {
          expect(spy.add.calledOnce).to.be.true;
          expect(spy.add.getCall(0).args).to.deep.equal(['x', signatures.Database]);
          expect(spy.scopeAt(1)).to.deep.equal({}); // const not hoisted to top
        });
      });
    });
    describe('let', () => {
      describe('top-level', () => {
        describe('without assignment', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{}, {}], signatures));
            writer = writer = new AsyncWriter(signatures, spy);
            input = 'let x';
            const result = writer.getTransform(input);
            ast = result.ast;
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('let x;');
          });
          it('adds to symbol table', () => {
            expect(spy.add.calledOnce).to.be.true;
            expect(spy.add.getCall(0).args).to.deep.equal(['x', { type: 'unknown', attributes: {} }]);
            expect(spy.scopeAt(1)).to.deep.equal({ x: { type: 'unknown', attributes: {} } });
          });
        });
        describe('with assignment', () => {
          describe('rhs is unknown type', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{}, {}], signatures));
              writer = writer = new AsyncWriter(signatures, spy);
              input = 'let x = 1';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('let x = 1;');
            });
            it('adds to symbol table', () => {
              expect(spy.add.calledOnce).to.be.true;
              expect(spy.add.getCall(0).args).to.deep.equal(['x', { type: 'unknown', attributes: {} }]);
              expect(spy.scopeAt(1)).to.deep.equal({ x: { type: 'unknown', attributes: {} } });
            });
          });
          describe('rhs is known type', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              input = 'let x = db';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('let x = db;');
            });
            it('adds to symbol table', () => {
              expect(spy.add.calledOnce).to.be.true;
              expect(spy.add.getCall(0).args).to.deep.equal(['x', signatures.Database]);
              expect(spy.scopeAt(1)).to.deep.equal({ x: signatures.Database });
            });
          });
        });
        describe('redefine existing variable', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, { myVar: myType }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            input = 'let myVar = 1';
            const result = writer.getTransform(input);
            ast = result.ast;
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('let myVar = 1;');
          });
          it('adds to symbol table', () => {
            expect(spy.add.calledOnce).to.be.true;
            expect(spy.add.getCall(0).args).to.deep.equal(['myVar', { type: 'unknown', attributes: {} }]);
            expect(spy.scopeAt(1)).to.deep.equal({ myVar: myType });
            expect(spy.scopeAt(2)).to.deep.equal({ myVar: { type: 'unknown', attributes: {} } });
          });
        });
      });
      describe('inside function scope', () => {
        const type = { returnType: { type: 'unknown', attributes: {} }, returnsPromise: false, type: 'function' };
        before(() => {
          spy = sinon.spy(new SymbolTable([ { db: signatures.Database }, {} ], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = 'function f() { let x = db; }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('function f() {\n  let x = db;\n}');
        });
        it('adds to symbol table', () => {
          expect(spy.add.calledOnce).to.be.false;
          const calls = spy.updateFunctionScoped.getCall(0);
          expect(calls.args[1]).to.equal('f');
          expect(skipPath(calls.args[2])).to.deep.equal(type);
          expect(spy.lookup('x')).to.deep.equal({ type: 'unknown', attributes: {} });
        });
      });
      describe('inside block scope', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([ { db: signatures.Database }, {} ], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = '{ let x = db; }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('{\n  let x = db;\n}');
        });
        it('adds to symbol table', () => {
          expect(spy.add.calledOnce).to.be.true;
          expect(spy.add.getCall(0).args).to.deep.equal(['x', signatures.Database]);
          expect(spy.scopeAt(1)).to.deep.equal({}); // const not hoisted to top
        });
      });
    });
  });
  describe('AssignmentExpression', () => {
    describe('non-symbol lval', () => {
      describe('Array/Object Pattern', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
        });
        it('array pattern throws for async type', () => {
          try {
            compileCheckScopes(writer, '[a, b] = [1, db]');
          } catch (e) {
            expect(e.name).to.be.equal('MongoshUnimplementedError');
            expect(e.code).to.be.equal(AsyncRewriterErrors.DestructuringNotImplemented);
          }
        });
        it('array pattern ignored for non-async', () => {
          expect(compileCheckScopes(writer, '[a, b] = [1, 2]')).to.equal('[a, b] = [1, 2];');
        });
        // NOTE: babel parser doesn't like this syntax.
        // it('object pattern throws for async type', () => {
        //   expect(() => compileCheckScopes(writer, '{a} = {a: db}')).to.throw();
        // });
        // it('object pattern ignored for non-async', () => {
        //   expect(compileCheckScopes(writer, '{a, b} = {a: 1, b: 2}')).to.equal('{a, b} = {\n  a: 1,\n  b: 2\n};');
        // });
      });
      describe('MemberExpression', () => {
        describe('with non-async type', () => {
          describe('with identifiers', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              compileCheckScopes(writer, 'x = {}');
              input = 'x.y = 1';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('x.y = 1;');
            });
            it('decorates AssignmentExpression', (done) => {
              traverse(ast, {
                AssignmentExpression(path) {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              });
            });
            it('final symbol table state updated', () => {
              expect(spy.scopeAt(1).x).to.deep.equal({ type: 'object', hasAsyncChild: false, attributes: { y: { type: 'unknown', attributes: {} } } });
            });
          });
          describe('this expressions', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
            });
            it('fails on nested expressions', () => {
              input = 'class TestClass { testFn() { this.nested.whatever = bla } }';
              try {
                compileCheckScopes(writer, input);
              } catch (e) {
                expect(e).to.be.instanceOf(MongoshUnimplementedError);
                return;
              }
              expect.fail('expected error');
            });
          });
          describe('with string index', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              compileCheckScopes(writer, 'x = {}');
              input = 'x[\'y\'] = 1';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('x[\'y\'] = 1;');
            });
            it('decorates AssignmentExpression', (done) => {
              traverse(ast, {
                AssignmentExpression(path) {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              });
            });
            it('final symbol table state updated', () => {
              expect(spy.scopeAt(1).x).to.deep.equal({ type: 'object', hasAsyncChild: false, attributes: { y: { type: 'unknown', attributes: {} } } });
            });
          });
          describe('with number index', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              compileCheckScopes(writer, 'x = {}');
              input = 'x[0] = 1';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('x[0] = 1;');
            });
            it('decorates AssignmentExpression', (done) => {
              traverse(ast, {
                AssignmentExpression(path) {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              });
            });
            it('final symbol table state updated', () => {
              expect(spy.scopeAt(1).x).to.deep.equal({ type: 'object', hasAsyncChild: false, attributes: { 0: { type: 'unknown', attributes: {} } } });
            });
          });
          describe('with non-symbol LHS', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              input = '[1,2][0] = 1';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('[1, 2][0] = 1;');
            });
            it('decorates AssignmentExpression', (done) => {
              traverse(ast, {
                AssignmentExpression(path) {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              });
            });
          });
          describe('modified in-place', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              compileCheckScopes(writer, 'x = 1');
              compileCheckScopes(writer, 'y = x');
              compileCheckScopes(writer, 'y.a = db');
            });
            it('final symbol table state updated', () => {
              expect(spy.scopeAt(1).x).to.deep.equal({ type: 'object', hasAsyncChild: true, attributes: { a: signatures.Database } });
              expect(spy.scopeAt(1).y).to.deep.equal({ type: 'object', hasAsyncChild: true, attributes: { a: signatures.Database } });
            });
          });
        });
        describe('assigning to hasAsyncChild type', () => {
          describe('with identifiers', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              compileCheckScopes(writer, 'x = {db: db}');
              input = 'x.y = 1';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('x.y = 1;');
            });
            it('decorates AssignmentExpression', (done) => {
              traverse(ast, {
                AssignmentExpression(path) {
                  expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                  done();
                }
              });
            });
            it('final symbol table state updated', () => {
              expect(spy.scopeAt(1).x).to.deep.equal({ type: 'object', hasAsyncChild: true, attributes: { db: signatures.Database, y: { type: 'unknown', attributes: {} } } });
            });
          });
          describe('with computed index', () => {
            it('throws', () => {
              writer = new AsyncWriter(signatures);
              writer.symbols.initializeApiObjects({ db: signatures.Database });
              compileCheckScopes(writer, 'x = {db: db}');
              try {
                compileCheckScopes(writer, 'x[a] = 1');
              } catch (e) {
                expect(e.name).to.be.equal('MongoshInvalidInputError');
                expect(e.code).to.be.equal(AsyncRewriterErrors.DynamicAccessOfApiType);
              }
            });
          });
        });
        describe('assigning async type', () => {
          describe('with identifiers', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              compileCheckScopes(writer, 'x = {}');
              input = 'x.y = db';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('x.y = db;');
            });
            it('decorates AssignmentExpression', (done) => {
              traverse(ast, {
                AssignmentExpression(path) {
                  expect(path.node['shellType']).to.deep.equal(signatures.Database);
                  done();
                }
              });
            });
            it('final symbol table state updated', () => {
              expect(spy.scopeAt(1).x).to.deep.equal({ type: 'object', hasAsyncChild: true, attributes: { y: signatures.Database } });
            });
          });
          describe('with numeric indexes', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              compileCheckScopes(writer, 'x = {}');
              input = 'x[1] = db';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('x[1] = db;');
            });
            it('decorates AssignmentExpression', (done) => {
              traverse(ast, {
                AssignmentExpression(path) {
                  expect(path.node['shellType']).to.deep.equal(signatures.Database);
                  done();
                }
              });
            });
            it('final symbol table state updated', () => {
              expect(spy.scopeAt(1).x).to.deep.equal({ type: 'object', hasAsyncChild: true, attributes: { 1: signatures.Database } });
            });
          });
          describe('with string index', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              compileCheckScopes(writer, 'x = {}');
              input = 'x[\'y\'] = db';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('x[\'y\'] = db;');
            });
            it('decorates AssignmentExpression', (done) => {
              traverse(ast, {
                AssignmentExpression(path) {
                  expect(path.node['shellType']).to.deep.equal(signatures.Database);
                  done();
                }
              });
            });
            it('final symbol table state updated', () => {
              expect(spy.scopeAt(1).x).to.deep.equal({ type: 'object', hasAsyncChild: true, attributes: { y: signatures.Database } });
            });
          });
          describe('with computed index', () => {
            before(() => {
              writer = new AsyncWriter(signatures);
              writer.symbols.initializeApiObjects({ db: signatures.Database });
              compileCheckScopes(writer, 'x = {}');
            });
            it('throws assigning an async type', () => {
              try {
                compileCheckScopes(writer, 'x[a] = db');
              } catch (e) {
                expect(e.name).to.be.equal('MongoshInvalidInputError');
                expect(e.code).to.be.equal(AsyncRewriterErrors.DynamicAccessOfApiType);
              }
            });
          });
          describe('with non-symbol LHS', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
              input = '[1, 2][0] = db';
              const result = writer.getTransform(input);
              ast = result.ast;
              output = result.code;
            });
            it('compiles correctly', () => {
              expect(output).to.equal('[1, 2][0] = db;');
            });
            it('decorates AssignmentExpression', (done) => {
              traverse(ast, {
                AssignmentExpression(path) {
                  expect(path.node['shellType']).to.deep.equal(signatures.Database);
                  done();
                }
              });
            });
          });
        });
      });
    });
    describe('top-level scope', () => {
      describe('new symbol', () => {
        describe('rhs is known type', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            input = 'x = db';
            const result = writer.getTransform(input);
            ast = result.ast;
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('x = db;');
          });
          it('decorates AssignmentExpression', (done) => {
            traverse(ast, {
              AssignmentExpression(path) {
                expect(path.node['shellType']).to.deep.equal(signatures.Database);
                done();
              }
            });
          });
          it('updates symbol table', () => {
            expect(spy.updateIfDefined.calledOnce).to.be.true;
            expect(spy.updateIfDefined.getCall(0).args).to.deep.equal([
              'x', signatures.Database
            ]);
            expect(spy.updateFunctionScoped.calledOnce).to.be.true;
            const args = spy.updateFunctionScoped.getCall(0).args;
            expect(args[1]).to.equal('x');
            expect(args[2]).to.deep.equal(signatures.Database);
          });
          it('final symbol table state updated', () => {
            expect(spy.scopeAt(1)).to.deep.equal({ x: signatures.Database });
          });
        });
        describe('rhs is unknown type', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            input = 'x = 1';
            const result = writer.getTransform(input);
            ast = result.ast;
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('x = 1;');
          });
          it('decorates AssignmentExpression', (done) => {
            traverse(ast, {
              AssignmentExpression(path) {
                expect(path.node['shellType']).to.deep.equal({ type: 'unknown', attributes: {} });
                done();
              }
            });
          });
          it('updates symbol table', () => {
            expect(spy.updateIfDefined.calledOnce).to.be.true;
            expect(spy.updateIfDefined.getCall(0).args).to.deep.equal([
              'x', { type: 'unknown', attributes: {} }
            ]);
            expect(spy.updateFunctionScoped.calledOnce).to.be.true;
            const args = spy.updateFunctionScoped.getCall(0).args;
            expect(args[1]).to.equal('x');
            expect(args[2]).to.deep.equal({ type: 'unknown', attributes: {} });
          });
          it('final symbol table state updated', () => {
            expect(spy.scopeAt(1)).to.deep.equal({ x: { type: 'unknown', attributes: {} } });
          });
        });
      });
      describe('existing symbol', () => {
        describe('redef upper variable', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, { myVar: myType }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            input = 'myVar = db';
            const result = writer.getTransform(input);
            ast = result.ast;
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('myVar = db;');
          });
          it('decorates AssignmentExpression', (done) => {
            traverse(ast, {
              AssignmentExpression(path) {
                expect(path.node['shellType']).to.deep.equal(signatures.Database);
                done();
              }
            });
          });
          it('updates symbol table', () => {
            expect(spy.updateIfDefined.calledOnce).to.be.true;
            expect(spy.updateIfDefined.getCall(0).args).to.deep.equal([
              'myVar', signatures.Database
            ]);
            expect(spy.updateFunctionScoped.calledOnce).to.be.false;
          });
          it('final symbol table state updated', () => {
            expect(spy.lookup('myVar')).to.deep.equal(signatures.Database);
          });
        });
        describe('previously defined var', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            compileCheckScopes(writer, 'var a = 1');
            const result = writer.getTransform('a = db');
            ast = result.ast;
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('a = db;');
          });
          it('updates symbol table for assignment', () => {
            expect(spy.updateIfDefined.calledOnce).to.be.true;
            expect(spy.updateIfDefined.getCall(0).args).to.deep.equal([
              'a', signatures.Database
            ]);
          });
          it('final symbol table state updated', () => {
            expect(spy.scopeAt(1)).to.deep.equal({ a: signatures.Database });
          });
        });
        describe('previously defined let', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            compileCheckScopes(writer, 'let a = 1');
            const result = writer.getTransform('a = db');
            ast = result.ast;
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('a = db;');
          });
          it('updates symbol table for assignment', () => {
            expect(spy.updateIfDefined.calledOnce).to.be.true;
            expect(spy.updateIfDefined.getCall(0).args).to.deep.equal([
              'a', signatures.Database
            ]);
          });
          it('final symbol table state updated', () => {
            expect(spy.scopeAt(1)).to.deep.equal({ a: signatures.Database });
          });
        });
      });
    });
    describe('inner scope', () => {
      describe('new symbol', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          const result = writer.getTransform('{ a = db }');
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('{\n  a = db;\n}');
        });
        it('updates symbol table for assignment', () => {
          expect(spy.updateIfDefined.calledOnce).to.be.true;
          expect(spy.updateIfDefined.getCall(0).args).to.deep.equal([
            'a', signatures.Database
          ]);
          expect(spy.updateFunctionScoped.calledOnce).to.be.true;
          const args = spy.updateFunctionScoped.getCall(0).args;
          expect(args[1]).to.equal('a');
          expect(args[2]).to.deep.equal(signatures.Database);
        });
        it('final symbol table state updated', () => {
          expect(spy.scopeAt(1)).to.deep.equal({ a: signatures.Database });
        });
      });
      describe('existing symbol', () => {
        describe('declared as var in outer', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            compileCheckScopes(writer, 'var a;');
            output = compileCheckScopes(writer, '{ a = db }');
          });
          it('compiles correctly', () => {
            expect(output).to.equal('{\n  a = db;\n}');
          });
          it('updates symbol table for assignment', () => {
            expect(spy.updateIfDefined.calledOnce).to.be.true;
            expect(spy.updateIfDefined.getCall(0).args).to.deep.equal([
              'a', signatures.Database
            ]);
          });
          it('updates symbol table for var', () => {
            expect(spy.updateFunctionScoped.calledOnce).to.be.true;
            const args = spy.updateFunctionScoped.getCall(0).args;
            expect(args[1]).to.equal('a');
            expect(args[2]).to.deep.equal({ type: 'unknown', attributes: {} });
          });
          it('final symbol table state updated', () => {
            expect(spy.scopeAt(1)).to.deep.equal({ a: signatures.Database });
          });
        });
        describe('declared with let in outer', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            compileCheckScopes(writer, 'let a;');
            output = compileCheckScopes(writer, '{ a = db }');
          });
          it('compiles correctly', () => {
            expect(output).to.equal('{\n  a = db;\n}');
          });
          it('updates symbol table for assignment', () => {
            expect(spy.updateIfDefined.calledOnce).to.be.true;
            expect(spy.updateIfDefined.getCall(0).args).to.deep.equal([
              'a', signatures.Database
            ]);
          });
          it('updates symbol table for let', () => {
            expect(spy.updateFunctionScoped.calledOnce).to.be.false;
            expect(spy.add.calledOnce).to.be.true;
            expect(spy.add.getCall(0).args).to.deep.equal(['a', { type: 'unknown', attributes: {} }]);
          });
          it('final symbol table state updated', () => {
            expect(spy.scopeAt(1)).to.deep.equal({ a: signatures.Database });
          });
        });
        describe('assigned without declaration in outer', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            compileCheckScopes(writer, 'a = 1;');
            output = compileCheckScopes(writer, '{ a = db }');
          });
          it('compiles correctly', () => {
            expect(output).to.equal('{\n  a = db;\n}');
          });
          it('updates symbol table for initial assignment', () => {
            expect(spy.updateIfDefined.calledTwice).to.be.true;
            expect(spy.updateIfDefined.getCall(0).args).to.deep.equal([
              'a', { type: 'unknown', attributes: {} }
            ]);
            expect(spy.updateIfDefined.getCall(1).args).to.deep.equal([
              'a', signatures.Database
            ]);
          });
          it('updates symbol table for var', () => {
            expect(spy.updateFunctionScoped.calledOnce).to.be.true;
            const args = spy.updateFunctionScoped.getCall(0).args;
            expect(args[1]).to.equal('a');
            expect(args[2]).to.deep.equal({ type: 'unknown', attributes: {} });
          });
          it('final symbol table state updated', () => {
            expect(spy.scopeAt(1)).to.deep.equal({ a: signatures.Database });
          });
        });
      });
    });
    describe('inside function', () => {
      describe('new symbol', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          const result = writer.getTransform('function x() { a = db }');
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('function x() {\n  a = db;\n}');
        });
        it('final symbol table state updated', () => {
          expect(skipPath(spy.scopeAt(1).x)).to.deep.equal( { returnType: { type: 'unknown', attributes: {} }, returnsPromise: false, type: 'function' } );
        });
      });
      describe('existing symbol', () => {
        describe('declared as var in outer', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            compileCheckScopes(writer, 'var a;');
            output = compileCheckScopes(writer, 'function x() { a = db }');
          });
          it('compiles correctly', () => {
            expect(output).to.equal('function x() {\n  a = db;\n}');
          });
          it('final symbol table state updated', () => {
            expect(spy.scopeAt(1).a).to.deep.equal( { type: 'unknown', attributes: {} });
            expect(skipPath(spy.scopeAt(1).x)).to.deep.equal( { returnType: { type: 'unknown', attributes: {} }, returnsPromise: false, type: 'function' } );
          });
        });
      });
    });
  });
  describe('Function', () => {
    describe('without internal await', () => {
      describe('function keyword', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = 'function fn() { return db; }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('function fn() {\n' +
            '  return db;\n' +
            '}');
        });
        it('decorates Function', (done) => {
          traverse(ast, {
            Function(path) {
              expect(skipPath(path.node['shellType'])).to.deep.equal({ type: 'function', returnsPromise: false, returnType: signatures.Database });
              done();
            }
          });
        });
        it('updates symbol table', () => {
          expect(spy.updateFunctionScoped.calledOnce).to.be.true;
          const calls = spy.updateFunctionScoped.getCall(0).args;
          expect(calls[1]).to.equal('fn');
          expect(skipPath(calls[2])).to.deep.equal({ type: 'function', returnsPromise: false, returnType: signatures.Database });
        });
      });
      describe('arrow function', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = '() => { return db; }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('() => {\n' +
            '  return db;\n' +
            '};');
        });
        it('decorates Function', (done) => {
          traverse(ast, {
            Function(path) {
              expect(skipPath(path.node['shellType'])).to.deep.equal({ type: 'function', returnsPromise: false, returnType: signatures.Database });
              done();
            }
          });
        });
        it('updates symbol table', () => {
          expect(spy.scopeAt(1)).to.deep.equal({});
        });
      });
    });
    describe('with internal await', () => {
      describe('arrow function with await within', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = '() => { db.coll.insertOne({}); }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('async () => {\n' +
            '  await db.coll.insertOne({});\n' +
            '};');
        });
        it('decorates Function', (done) => {
          traverse(ast, {
            Function(path) {
              expect(skipPath(path.node['shellType'])).to.deep.equal({ type: 'function', returnsPromise: true, returnType: { type: 'unknown', attributes: {} } });
              done();
            }
          });
        });
      });
      describe('function keyword with await within', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = 'function fn() { db.coll.insertOne({}); }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('async function fn() {\n' +
            '  await db.coll.insertOne({});\n' +
            '}');
        });
        it('decorates Function', (done) => {
          traverse(ast, {
            Function(path) {
              expect(skipPath(path.node['shellType'])).to.deep.equal({ type: 'function', returnsPromise: true, returnType: { type: 'unknown', attributes: {} } });
              done();
            }
          });
        });
        it('updates symbol table', () => {
          expect(spy.updateFunctionScoped.calledOnce).to.be.true;
          const calls = spy.updateFunctionScoped.getCall(0).args;
          expect(calls[1]).to.equal('fn');
          expect(skipPath(calls[2])).to.deep.equal({ type: 'function', returnsPromise: true, returnType: { type: 'unknown', attributes: {} } });
        });
      });
      describe('already an async function', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = 'async function fn() { db.coll.insertOne({}); }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('async function fn() {\n' +
            '  await db.coll.insertOne({});\n' +
            '}');
        });
        it('decorates Function', (done) => {
          traverse(ast, {
            Function(path) {
              expect(skipPath(path.node['shellType'])).to.deep.equal({ type: 'function', returnsPromise: true, returnType: { type: 'unknown', attributes: {} } });
              done();
            }
          });
        });
        it('updates symbol table', () => {
          expect(spy.updateFunctionScoped.calledOnce).to.be.true;
          const calls = spy.updateFunctionScoped.getCall(0).args;
          expect(calls[1]).to.equal('fn');
          expect(skipPath(calls[2])).to.deep.equal({ type: 'function', returnsPromise: true, returnType: { type: 'unknown', attributes: {} } });
        });
      });
    });
    describe('return statements', () => {
      describe('with empty return statement', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = '() => { return; }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('() => {\n' +
            '  return;\n' +
            '};');
        });
        it('decorates Function', (done) => {
          traverse(ast, {
            Function(path) {
              expect(skipPath(path.node['shellType'])).to.deep.equal({ type: 'function', returnsPromise: false, returnType: { type: 'unknown', attributes: {} } });
              done();
            }
          });
        });
      });
      describe('with return value', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = '() => { return db; }';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('() => {\n' +
            '  return db;\n' +
            '};');
        });
        it('decorates Function', (done) => {
          traverse(ast, {
            Function(path) {
              expect(skipPath(path.node['shellType'])).to.deep.equal({ type: 'function', returnsPromise: false, returnType: signatures.Database });
              done();
            }
          });
        });
      });
      describe('with implicit return value', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = '() => (db)';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('() => db;');
        });
        it('decorates Function', (done) => {
          traverse(ast, {
            Function(path) {
              expect(skipPath(path.node['shellType'])).to.deep.equal({ type: 'function', returnsPromise: false, returnType: signatures.Database });
              done();
            }
          });
        });
      });
      describe('with {} and no return statement', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = '() => {1; db}';
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal('() => {\n  1;\n  db;\n};');
        });
        it('decorates Function', (done) => {
          traverse(ast, {
            Function(path) {
              expect(skipPath(path.node['shellType'])).to.deep.equal({ type: 'function', returnsPromise: false, returnType: { type: 'unknown', attributes: {} } });
              done();
            }
          });
        });
      });
      describe('with multiple return values of different signatures', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = `
() => {
  if (TEST) {
    return db;
  } else {
    return 1;
  }
}`;
        });
        it('throws', () => {
          try {
            compileCheckScopes(writer, input);
          } catch (e) {
            expect(e.name).to.be.equal('MongoshInvalidInputError');
            expect(e.code).to.be.equal(AsyncRewriterErrors.ConditionalReturn);
          }
        });
      });
      describe('with multiple return values of the same non-async type', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = `
() => {
  if (TEST) {
    return 2;
  } else {
    return 1;
  }
}`;
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal(`() => {
  if (TEST) {
    return 2;
  } else {
    return 1;
  }
};`);
        });
        it('decorates Function', (done) => {
          traverse(ast, {
            Function(path) {
              expect(skipPath(path.node['shellType'])).to.deep.equal({ type: 'function', returnsPromise: false, returnType: { type: 'unknown', attributes: {} } });
              done();
            }
          });
        });
      });
      describe('with multiple return values of the same async type', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = `
() => {
  if (TEST) {
    return db.coll;
  } else {
    return db.coll2;
  }
}`;
        });
        it('throws', () => {
          try {
            compileCheckScopes(writer, input);
          } catch (e) {
            expect(e.name).to.be.equal('MongoshInvalidInputError');
            expect(e.code).to.be.equal(AsyncRewriterErrors.ConditionalReturn);
          }
        });
      });
      describe('function returns a function', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = `
function f() {
  return () => {
    return db;
  }
}`;
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal(`function f() {
  return () => {
    return db;
  };
}`);
        });
        it('decorates Function', (done) => {
          traverse(ast, {
            FunctionDeclaration(path) {
              expect(Object.keys(path.node['shellType'])).to.deep.equal([ 'type', 'returnsPromise', 'returnType', 'path' ]);
              expect(path.node['shellType'].type).to.equal('function');
              expect(path.node['shellType'].returnsPromise).to.be.false;
              expect(skipPath(path.node['shellType'].returnType)).to.deep.equal(
                { type: 'function', returnsPromise: false, returnType: signatures.Database }
              );
              done();
            }
          });
        });
      });
      describe('function defined inside a function', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = `
function f() {
  function g() {
    return db.coll.find;
  };
  return 1;
}`;
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal(`function f() {
  function g() {
    return db.coll.find;
  }

  ;
  return 1;
}`);
        });
        it('decorates outer Function', (done) => {
          traverse(ast, {
            FunctionDeclaration(path) {
              if (path.node.id.name === 'f') {
                expect(skipPath(path.node['shellType'])).to.deep.equal({
                  type: 'function',
                  returnsPromise: false,
                  returnType: { type: 'unknown', attributes: {} }
                });
                done();
              }
            }
          });
        });
        it('decorates inner Function', (done) => {
          traverse(ast, {
            FunctionDeclaration(path) {
              if (path.node.id.name === 'g') {
                expect(skipPath(path.node['shellType'])).to.deep.equal({
                  type: 'function',
                  returnsPromise: false,
                  returnType: signatures.Collection.attributes.find
                });
                done();
              }
            }
          });
        });
      });
    });
    describe('scoping', () => {
      describe('ensure keyword function name is hoisted', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = '{ function f() {} }';
          const result = writer.getTransform(input);
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal(`{
  function f() {}
}`);
        });
        it('updates symbol table', () => {
          expect(Object.keys(spy.scopeAt(1))).to.deep.equal(['f']);
          expect(skipPath(spy.scopeAt(1).f)).to.deep.equal({ type: 'function', returnType: { type: 'unknown', attributes: {} }, returnsPromise: false } );
        });
      });
      describe('ensure assigned keyword function name is not hoisted', () => {
        describe('VariableDeclarator', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            input = 'const c = function f() {}';
            const result = writer.getTransform(input);
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('const c = function f() {};');
          });
          it('updates symbol table', () => {
            expect(spy.lookup('f')).to.deep.equal({ type: 'unknown', attributes: {} });
            expect(skipPath(spy.lookup('c'))).to.deep.equal({ type: 'function', returnType: { type: 'unknown', attributes: {} }, returnsPromise: false });
          });
        });
        describe('AssignmentExpression', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            input = 'c = function f() {}';
            const result = writer.getTransform(input);
            output = result.code;
          });
          it('compiles correctly', () => {
            expect(output).to.equal('c = function f() {};');
          });
          it('updates symbol table', () => {
            expect(spy.lookup('f')).to.deep.equal({ type: 'unknown', attributes: {} });
            expect(skipPath(spy.lookup('c'))).to.deep.equal({ type: 'function', returnType: { type: 'unknown', attributes: {} }, returnsPromise: false });
          });
        });
      });
      describe('function definition does not update symbol table', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = `
var a = db;
function f() {
  a = 1;
}
`;
          const result = writer.getTransform(input);
          output = result.code;
        });
        it('updates symbol table', () => {
          expect(spy.lookup('a')).to.deep.equal(signatures.Database);
        });
      });
    });
  });
  describe('ThisExpression', () => {
    before(() => {
      writer = new AsyncWriter(signatures);
    });
    it('errors outside of function', () => {
      input = 'this.x';
      try {
        compileCheckScopes(writer, input);
      } catch (e) {
        expect(e.name).to.be.equal('MongoshUnimplementedError');
        expect(e.code).to.be.equal(AsyncRewriterErrors.UsedThisOutsideOfMethodOfClassDeclaration);
      }
    });
    it('errors in regular function', () => {
      input = 'function x() { this.x = 1 }';
      try {
        compileCheckScopes(writer, input);
      } catch (e) {
        expect(e.name).to.be.equal('MongoshUnimplementedError');
        expect(e.code).to.be.equal(AsyncRewriterErrors.UsedThisOutsideOfMethodOfClassDeclaration);
      }
    });
    it('errors in object', () => {
      input = '{ function x() { this.x = 1 } }';
      try {
        compileCheckScopes(writer, input);
      } catch (e) {
        expect(e.name).to.be.equal('MongoshUnimplementedError');
        expect(e.code).to.be.equal(AsyncRewriterErrors.UsedThisOutsideOfMethodOfClassDeclaration);
      }
    });
  });
  describe('ClassDeclaration', () => {
    describe('without this', () => {
      const type = {
        type: 'classdef',
        returnType: {
          type: 'Test',
          attributes: {
            regularFn: { type: 'function', returnType: signatures.Database, returnsPromise: false },
            awaitFn: { type: 'function', returnType: { type: 'unknown', attributes: {} }, returnsPromise: true }
          }
        }
      };
      before(() => {
        spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
        writer = new AsyncWriter(signatures, spy);
      });
      describe('adds methods to class', () => {
        before(() => {
          input = `
class Test {
  regularFn() { return db; }
  awaitFn() { db.coll.insertOne({}) }
};`;
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal(`class Test {
  regularFn() {
    return db;
  }

  async awaitFn() {
    await db.coll.insertOne({});
  }

}

;`);
        });
        it('decorates ClassDeclaration', (done) => {
          traverse(ast, {
            ClassDeclaration(path) {
              const rt = path.node['shellType'];
              expect(rt.type).to.equal('classdef');
              expect(rt.returnType.type).to.equal('Test');
              expect(skipPath(rt.returnType.attributes.regularFn)).to.deep.equal(type.returnType.attributes.regularFn);
              expect(skipPath(rt.returnType.attributes.awaitFn)).to.deep.equal(type.returnType.attributes.awaitFn);
              done();
            }
          });
        });
        it('updates symbol table', () => {
          expect(spy.addToParent.calledOnce).to.be.true;
          const call = spy.addToParent.getCall(0);
          expect(call.args[0]).to.equal('Test');
          const rt = call.args[1];
          expect(rt.type).to.equal('classdef');
          expect(rt.returnType.type).to.equal('Test');
          expect(skipPath(rt.returnType.attributes.regularFn)).to.deep.equal(type.returnType.attributes.regularFn);
          expect(skipPath(rt.returnType.attributes.awaitFn)).to.deep.equal(type.returnType.attributes.awaitFn);
        });
      });
    });
    describe('with this', () => {
      describe('with async methods', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = `
class Test {
  awaitFn() { db.coll.insertOne({}) }
  regularFn() { this.awaitFn(); }
};`;
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal(`class Test {
  async awaitFn() {
    await db.coll.insertOne({});
  }

  async regularFn() {
    await this.awaitFn();
  }

}

;`);
        });
        it('updates symbol table', () => {
          const type = spy.lookup('Test');
          expect(type.type).to.equal('classdef');
          expect(type.returnType.type).to.equal('Test');
          expect(skipPath(type.returnType.attributes.awaitFn)).to.deep.equal({
            type: 'function',
            returnsPromise: true,
            returnType: {
              type: 'unknown',
              attributes: {}
            }
          });
          expect(skipPath(type.returnType.attributes.regularFn)).to.deep.equal({
            type: 'function',
            returnsPromise: true,
            returnType: {
              type: 'unknown',
              attributes: {}
            }
          });
        });
        it('can handle instantiating', () => {
          expect(compileCheckScopes(writer, 't = new Test()')).to.equal('t = new Test();');
          expect(compileCheckScopes(writer, 't.awaitFn()')).to.equal('await t.awaitFn();');
        });
      });
      describe('with attributes', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = `
class Test {
  constructor() {
    this.db = db;
  }
  awaitFn() { this.db.coll.insertOne({}) }
};`;
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal(`class Test {
  constructor() {
    this.db = db;
  }

  async awaitFn() {
    await this.db.coll.insertOne({});
  }

}

;`);
        });
        it('updates symbol table', () => {
          const type = spy.lookup('Test');
          expect(type.type).to.equal('classdef');
          expect(type.returnType.type).to.equal('Test');
          expect(type.returnType.attributes.db).to.deep.equal(signatures.Database);
          expect(skipPath(type.returnType.attributes.awaitFn)).to.deep.equal({
            type: 'function',
            returnsPromise: true,
            returnType: {
              type: 'unknown',
              attributes: {}
            }
          });
        });
        it('can handle instantiating', () => {
          expect(compileCheckScopes(writer, 't = new Test()')).to.equal('t = new Test();');
          expect(compileCheckScopes(writer, 't.awaitFn()')).to.equal('await t.awaitFn();');
        });
      });
      describe('with attribute assignment in other function', () => {
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          input = `
class Test {
  myFunc() { x.y = 1 }
};`;
          const result = writer.getTransform(input);
          ast = result.ast;
          output = result.code;
        });
        it('compiles correctly', () => {
          expect(output).to.equal(`class Test {
  myFunc() {
    x.y = 1;
  }

}

;`);
        });
        it('updates symbol table', () => {
          const type = spy.lookup('Test');
          expect(type.type).to.equal('classdef');
          expect(type.returnType.type).to.equal('Test');
          expect(skipPath(type.returnType.attributes.myFunc)).to.deep.equal({
            type: 'function',
            returnsPromise: false,
            returnType: {
              type: 'unknown',
              attributes: {}
            }
          });
        });
        it('can handle instantiating', () => {
          expect(compileCheckScopes(writer, 't = new Test()')).to.equal('t = new Test();');
          expect(compileCheckScopes(writer, 't.myFunc()')).to.equal('t.myFunc();');
        });
      });
      describe('error cases', () => {
        before(() => {
          writer = new AsyncWriter(signatures);
        });
        it('use before define', () => {
          input = `
class Test {
  regularFn() { this.awaitFn(); }
  awaitFn() { db.coll.insertOne({}) }
}`;
          try {
            compileCheckScopes(writer, input);
          } catch (e) {
            expect(e.name).to.be.equal('MongoshInvalidInputError');
            expect(e.code).to.be.equal(AsyncRewriterErrors.UsedMemberInClassBeforeDefinition);
          }
        });
        it('assign this not in constructor', () => {
          input = `
  class Test {
    regularFn() { this.db = db; }
  }`;
          try {
            compileCheckScopes(writer, input);
          } catch (e) {
            expect(e.name).to.be.equal('MongoshUnimplementedError');
            expect(e.code).to.be.equal('TODO'); // TODO: introduce proper error code with MONGOSH-473
          }
        });
        it('nested this assignment', () => {
          input = `
  class Test {
    constructor() { this.obj = {}; this.obj.db = db; }
  }`;
          try {
            compileCheckScopes(writer, input);
            expect.fail('expected error');
          } catch (e) {
            expect(e.name).to.be.equal('MongoshUnimplementedError');
            expect(e.code).to.be.equal(AsyncRewriterErrors.NestedThisAssignment);
          }
        });
      });
    });
  });
  describe('classes with returnsPromise', () => {
    describe('with promise', () => {
      before(() => {
        writer = new AsyncWriter(signatures);
      });
      it('adds await in front of new', () => {
        expect(compileCheckScopes(writer, 'new Mongo()')).to.equal('await new Mongo();');
      });
      it('adds await in front of regular call', () => {
        expect(compileCheckScopes(writer, 'Mongo()')).to.equal('await Mongo();');
      });
      it('updates if within function', () => {
        expect(compileCheckScopes(writer, '() => { m = new Mongo() }')).to.equal('async () => {\n  m = await new Mongo();\n};');
      });
    });
  });
  describe('NewExpression', () => {
    const type = {
      type: 'classdef',
      returnType: {
        type: 'Test',
        attributes: {
          regularFn: { type: 'function', returnType: signatures.Database, returnsPromise: false },
          awaitFn: { type: 'function', returnType: { type: 'unknown', attributes: {} }, returnsPromise: true }
        }
      }
    };
    before(() => {
      spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
      writer = new AsyncWriter(signatures, spy);
      compileCheckScopes(writer, `
class Test {
  regularFn() { return db; }
  awaitFn() { db.coll.insertOne({}) }
};`);
      const result = writer.getTransform('const x = new Test()');
      ast = result.ast;
      output = result.code;
    });
    it('compiles correctly', () => {
      expect(output).to.equal('const x = new Test();');
    });
    it('decorates NewExpression', (done) => {
      traverse(ast, {
        NewExpression(path) {
          expect(path.node['shellType'].type).to.equal('Test');
          expect(skipPath(path.node['shellType'].attributes.regularFn)).to.deep.equal(type.returnType.attributes.regularFn);
          expect(skipPath(path.node['shellType'].attributes.awaitFn)).to.deep.equal(type.returnType.attributes.awaitFn);
          done();
        }
      });
    });
    it('updates symbol table', () => {
      expect(spy.add.calledOnce).to.be.true;
      const call = spy.add.getCall(0);
      expect(call.args[0]).to.equal('x');
      expect(call.args[1].type).to.equal('Test');
      expect(skipPath(call.args[1].attributes.regularFn)).to.deep.equal(type.returnType.attributes.regularFn);
      expect(skipPath(call.args[1].attributes.awaitFn)).to.deep.equal(type.returnType.attributes.awaitFn);
    });
    it('throws when passing an async type', () => {
      const code = 'new Whatever(db)';
      try {
        compileCheckScopes(writer, code);
      } catch (e) {
        expect(e).to.be.instanceOf(MongoshInvalidInputError);
        expect(e.message).to.contain('Argument in position 0 is now an asynchronous function');
        return;
      }
      expect.fail('expected error');
    });
  });
  describe('branching', () => {
    describe('if statement', () => {
      describe('with only consequent', () => {
        describe('symbol defined in upper scope', () => {
          describe('signatures are the same', () => {
            describe('both async, same type', () => {
              before(() => {
                spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
                writer = new AsyncWriter(signatures, spy);
                output = compileCheckScopes(writer, `
a = db.coll1;
if (TEST) {
  a = db.coll2;
}
`);
              });
              it('compiles correctly', () => {
                expect(output).to.equal(`a = db.coll1;

if (TEST) {
  a = db.coll2;
}`);
              });
              it('symbol table final state is correct', () => {
                expect(spy.lookup('a')).to.deep.equal(signatures.Collection);
              });
            });
          });
          describe('both async, different type', () => {
            before(() => {
              spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
              writer = new AsyncWriter(signatures, spy);
            });
            it('throws MongoshInvalidInputError', () => {
              const throwInput = `
a = db;
if (TEST) {
  a = db.coll2;
}
`;
              try {
                compileCheckScopes(writer, throwInput);
              } catch (e) {
                expect(e.name).to.be.equal('MongoshInvalidInputError');
                expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
              }
            });
          });
          describe('signatures are not the same', () => {
            describe('top-level type async', () => {
              before(() => {
                spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
                writer = new AsyncWriter(signatures, spy);
              });
              it('throws MongoshInvalidInputError', () => {
                const throwInput = `
a = db.coll1;
if (TEST) {
  a = 1;
}
`;
                try {
                  compileCheckScopes(writer, throwInput);
                } catch (e) {
                  expect(e.name).to.be.equal('MongoshInvalidInputError');
                  expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
                }
              });
              it('symbol table final state is correct', () => {
                expect(spy.lookup('a')).to.deep.equal(signatures.Collection);
              });
            });
            describe('inner type async', () => {
              before(() => {
                spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
                writer = new AsyncWriter(signatures, spy);
              });
              it('throws MongoshInvalidInputError', () => {
                const throwInput = `
a = 1;
if (TEST) {
  a = db.coll;
}
`;
                try {
                  compileCheckScopes(writer, throwInput);
                } catch (e) {
                  expect(e.name).to.be.equal('MongoshInvalidInputError');
                  expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
                }
              });
              it('symbol table final state is correct', () => {
                expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
              });
            });
            describe('neither async', () => {
              before(() => {
                spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
                writer = new AsyncWriter(signatures, spy);
                output = compileCheckScopes(writer, `
a = 2;
if (TEST) {
  a = db.coll.find;
}
`);
              });
              it('compiles correctly', () => {
                expect(output).to.equal(`a = 2;

if (TEST) {
  a = db.coll.find;
}`);
              });
              it('symbol table final state is correct', () => {
                expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
              });
            });
          });
        });
        describe('const does not get hoisted', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, `
if (TEST) {
  const a = db.coll2;
}
`);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(`if (TEST) {
  const a = db.coll2;
}`);
          });
          it('symbol table final state is correct', () => {
            expect(spy.scopeAt(1)).to.deep.equal({ });
          });
        });
        describe('assignment to undecl var gets hoisted', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, `
if (TEST) {
  a = 1;
}
`);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(`if (TEST) {
  a = 1;
}`);
          });
          it('symbol table final state is correct', () => {
            expect(spy.scopeAt(1)).to.deep.equal({ a: { type: 'unknown', attributes: {} } });
          });
          it('throws for shell type', () => {
            try {
              compileCheckScopes(writer, 'if (TEST) { a = db }');
            } catch (e) {
              expect(e.name).to.be.equal('MongoshInvalidInputError');
              expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
            }
          });
        });
        describe('vars get hoisted', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, `
if (TEST) {
  var a = 1;
}
`);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(`if (TEST) {
  var a = 1;
}`);
          });
          it('symbol table final state is correct', () => {
            expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
          });
          it('throws for shell type', () => {
            try {
              compileCheckScopes(writer, 'if (TEST) { var a = db }');
            } catch (e) {
              expect(e.name).to.be.equal('MongoshInvalidInputError');
              expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
            }
          });
        });
      });
      describe('with alternate', () => {
        describe('undefined in upper scope', () => {
          describe('signatures are the same', () => {
            describe('both async', () => {
              before(() => {
                spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
                writer = new AsyncWriter(signatures, spy);
                output = compileCheckScopes(writer, `
if (TEST) {
  a = db.coll2;
} else {
  a = db.coll1;
}
`);
              });
              it('compiles correctly', () => {
                expect(output).to.equal(`if (TEST) {
  a = db.coll2;
} else {
  a = db.coll1;
}`);
              });
              it('symbol table final state is correct', () => {
                expect(spy.lookup('a')).to.deep.equal(signatures.Collection);
              });
            });
          });
          describe('signatures are not the same', () => {
            describe('alternate type async', () => {
              before(() => {
                spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
                writer = new AsyncWriter(signatures, spy);
              });
              it('throws MongoshInvalidInputError', () => {
                const throwInput = `
if (TEST) {
  a = 1;
} else {
  a = db;
}
`;
                try {
                  compileCheckScopes(writer, throwInput);
                } catch (e) {
                  expect(e.name).to.be.equal('MongoshInvalidInputError');
                  expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
                }
              });
              it('symbol table final state is correct', () => {
                expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
              });
            });
            describe('inner type async', () => {
              before(() => {
                spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
                writer = new AsyncWriter(signatures, spy);
              });
              it('throws MongoshInvalidInputError', () => {
                const throwInput = `
if (TEST) {
  a = db;
} else {
  a = 1;
}
`;
                try {
                  compileCheckScopes(writer, throwInput);
                } catch (e) {
                  expect(e.name).to.be.equal('MongoshInvalidInputError');
                  expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
                }
              });
              it('symbol table final state is correct', () => {
                expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
              });
            });
            describe('neither async', () => {
              before(() => {
                spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
                writer = new AsyncWriter(signatures, spy);
                output = compileCheckScopes(writer, `
if (TEST) {
  a = db.coll.find;
} else {
  a = 1;
}
`);
              });
              it('compiles correctly', () => {
                expect(output).to.equal(`if (TEST) {
  a = db.coll.find;
} else {
  a = 1;
}`);
              });
              it('symbol table final state is correct', () => {
                expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
              });
            });
          });
        });
        describe('else if', () => {
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, `
if (TEST) {
  a = db.coll.find;
} else if (TEST2) {
  a = 1;
}
`);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(`if (TEST) {
  a = db.coll.find;
} else {
  if (TEST2) {
    a = 1;
  }
}`);
          });
          it('symbol table final state is correct', () => {
            expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
          });
        });
      });
    });
    describe('loop', () => {
      describe('while', () => {
        describe('same type, async', () => {
          const inputLoop = `
a = db.coll1;
while (TEST) {
  a = db.coll2;
}
`;
          const expected = `a = db.coll1;

while (TEST) {
  a = db.coll2;
}`;

          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, inputLoop);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(expected);
          });
          it('symbol table final state is correct', () => {
            expect(spy.lookup('a')).to.deep.equal(signatures.Collection);
          });
        });
        describe('same type, nonasync', () => {
          const inputLoop = `
a = 2;
while (TEST) {
  a = db.coll.find;
}
`;
          const expected = `a = 2;

while (TEST) {
  a = db.coll.find;
}`;
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, inputLoop);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(expected);
          });
          it('symbol table final state is correct', () => {
            expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
          });
        });
        describe('different signatures', () => {
          const inputLoop = `
a = db.coll1;
while (TEST) {
  a = 1;
}
`;
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
          });
          it('throws', () => {
            try {
              compileCheckScopes(writer, inputLoop);
            } catch (e) {
              expect(e.name).to.be.equal('MongoshInvalidInputError');
              expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
            }
          });
        });
      });
      describe('for', () => {
        describe('same type, async', () => {
          const inputLoop = `
a = db.coll1;
for (let t = 0; t < 100; t++) {
  a = db.coll2;
}
`;
          const expected = `a = db.coll1;

for (let t = 0; t < 100; t++) {
  a = db.coll2;
}`;

          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, inputLoop);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(expected);
          });
          it('symbol table final state is correct', () => {
            expect(spy.lookup('a')).to.deep.equal(signatures.Collection);
          });
        });
        describe('same type, nonasync', () => {
          const inputLoop = `
a = 2;
for (let t = 0; t < 100; t++) {
  a = db.coll.find;
}
`;
          const expected = `a = 2;

for (let t = 0; t < 100; t++) {
  a = db.coll.find;
}`;
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, inputLoop);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(expected);
          });
          it('symbol table final state is correct', () => {
            expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
          });
        });
        describe('different signatures', () => {
          const inputLoop = `
a = db.coll1;
for (let t = 0; t < 100; t++) {
  a = 1;
}
`;
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
          });
          it('throws', () => {
            try {
              compileCheckScopes(writer, inputLoop);
            } catch (e) {
              expect(e.name).to.be.equal('MongoshInvalidInputError');
              expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
            }
          });
        });
      });
      describe('do while', () => {
        describe('same type, async', () => {
          const inputLoop = `
a = db.coll1;
do {
  a = db.coll2;
} while(TEST);
`;
          const expected = `a = db.coll1;

do {
  a = db.coll2;
} while ((TEST));`;

          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, inputLoop);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(expected);
          });
          it('symbol table final state is correct', () => {
            expect(spy.lookup('a')).to.deep.equal(signatures.Collection);
          });
        });
        describe('same type, nonasync', () => {
          const inputLoop = `
a = 2;
do {
  a = db.coll.find;
} while(TEST)
`;
          const expected = `a = 2;

do {
  a = db.coll.find;
} while ((TEST));`;
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, inputLoop);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(expected);
          });
          it('symbol table final state is correct', () => {
            expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
          });
        });
        describe('different signatures', () => {
          const inputLoop = `
a = db.coll1;
do {
  a = 1;
} while(TEST);
`;
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
          });
          it('throws', () => {
            try {
              compileCheckScopes(writer, inputLoop);
            } catch (e) {
              expect(e.name).to.be.equal('MongoshInvalidInputError');
              expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
            }
          });
        });
      });
      describe('for in', () => {
        const inputLoop = `
a = db.coll1;
for (const x in [1, 2, 3]) {
  a = 1;
}
`;
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
        });
        it('throws MongoshUnimplementedError', () => {
          try {
            compileCheckScopes(writer, inputLoop);
          } catch (e) {
            expect(e.name).to.be.equal('MongoshUnimplementedError');
            expect(e.code).to.be.equal(AsyncRewriterErrors.ForInForOfUnsupported);
          }
        });
      });
      describe('for of', () => {
        const inputLoop = `
a = db.coll1;
for (const x of [1, 2, 3]) {
  a = 1;
}
`;
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
        });
        it('throws MongoshUnimplementedError', () => {
          try {
            compileCheckScopes(writer, inputLoop);
          } catch (e) {
            expect(e.name).to.be.equal('MongoshUnimplementedError');
            expect(e.code).to.be.equal(AsyncRewriterErrors.ForInForOfUnsupported);
          }
        });
      });
    });
    describe('switch', () => {
      describe('exhaustive', () => {
        describe('same type, async', () => {
          const inputLoop = `
switch(TEST) {
  case 1:
    a = db.coll1;
  case 2:
    a = db.coll2;
  default:
    a = db.coll3;
}
`;
          const expected = `switch (TEST) {
  case 1:
    a = db.coll1;

  case 2:
    a = db.coll2;

  default:
    a = db.coll3;
}`;

          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, inputLoop);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(expected);
          });
          it('symbol table final state is correct', () => {
            expect(spy.lookup('a')).to.deep.equal(signatures.Collection);
          });
        });
        describe('same type, nonasync', () => {
          const inputLoop = `
switch(TEST) {
  case 1:
    a = 1;
  case 2:
    a = db.coll.find;
  default:
    a = 2;
}
`;
          const expected = `switch (TEST) {
  case 1:
    a = 1;

  case 2:
    a = db.coll.find;

  default:
    a = 2;
}`;
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, inputLoop);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(expected);
          });
          it('symbol table final state is correct', () => {
            expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
          });
        });
        describe('different signatures', () => {
          const inputLoop = `
switch(TEST) {
  case 1:
    a = db;
  case 2:
    a = db.coll.find;
  default:
    a = 2;
}
`;
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
          });
          it('throws', () => {
            try {
              compileCheckScopes(writer, inputLoop);
            } catch (e) {
              expect(e.name).to.be.equal('MongoshInvalidInputError');
              expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
            }
          });
        });
      });
      describe('non-exhaustive', () => {
        describe('predefined', () => {
          const inputLoop = `
a = db.coll;
switch(TEST) {
  case 1:
    a = db.coll1;
  case 2:
    a = db.coll2;
}
`;
          const expected = `a = db.coll;

switch (TEST) {
  case 1:
    a = db.coll1;

  case 2:
    a = db.coll2;
}`;

          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
            output = compileCheckScopes(writer, inputLoop);
          });
          it('compiles correctly', () => {
            expect(output).to.equal(expected);
          });
          it('symbol table final state is correct', () => {
            expect(spy.lookup('a')).to.deep.equal(signatures.Collection);
          });
        });
        describe('not predefined', () => {
          const inputLoop = `
switch(TEST) {
  case 1:
    a = db.coll1;
  case 2:
    a = db.coll2;
}
`;
          before(() => {
            spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
            writer = new AsyncWriter(signatures, spy);
          });
          it('throws', () => {
            try {
              compileCheckScopes(writer, inputLoop);
            } catch (e) {
              expect(e.name).to.be.equal('MongoshInvalidInputError');
              expect(e.code).to.be.equal(AsyncRewriterErrors.MixedApiTypeInScope);
            }
          });
        });
      });
    });
    describe('ternary', () => {
      describe('same type, async', () => {
        const inputLoop = 'a = TEST ? db.coll1 : db.coll2;';
        const expected = 'a = (TEST) ? (db.coll1) : (db.coll2);';
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          output = compileCheckScopes(writer, inputLoop);
        });
        it('compiles correctly', () => {
          expect(output).to.equal(expected);
        });
        it('symbol table final state is correct', () => {
          expect(spy.lookup('a')).to.deep.equal(signatures.Collection);
        });
      });
      describe('same type, nonasync', () => {
        const inputLoop = 'a = TEST ? 1 : db.coll.find;';
        const expected = 'a = (TEST) ? (1) : (db.coll.find);';
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
          output = compileCheckScopes(writer, inputLoop);
        });
        it('compiles correctly', () => {
          expect(output).to.equal(expected);
        });
        // it('symbol table final state is correct', () => {
        //   expect(spy.lookup('a')).to.deep.equal({ type: 'unknown', attributes: {} });
        // });
      });
      describe('different signatures', () => {
        const inputLoop = 'a = TEST ? 1 : db';
        before(() => {
          spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
          writer = new AsyncWriter(signatures, spy);
        });
        it('throws', () => {
          try {
            compileCheckScopes(writer, inputLoop);
          } catch (e) {
            expect(e.name).to.be.equal('MongoshInvalidInputError');
            expect(e.code).to.be.equal(AsyncRewriterErrors.ConditionalAssignment);
          }
        });
      });
    });
  });
  describe('Assign API type', () => {
    before(() => {
      writer = new AsyncWriter(signatures);
      writer.symbols.initializeApiObjects({ rs: myType, db: signatures.Database });
    });
    it('init', () => {
      expect(writer.symbols.scopeAt(0).rs).to.deep.equal({
        api: true,
        type: 'myType',
        attributes: { myAttr: { type: 'unknown', attributes: {}, api: true } }
      });
      const m = writer.symbols.scopeAt(0).Mongo;
      expect(m.hasAsyncChild).to.be.true;
      expect(m.returnsPromise).to.be.true;
    });
    it('regular add', () => {
      input = 'const rs = 1';
      try {
        compileCheckScopes(writer, input);
      } catch (err) {
        expect(err.name).to.be.equal('MongoshInvalidInputError');
        expect(err.code).to.be.equal(AsyncRewriterErrors.ModifyMongoshType);
      }
    });
    it('ok with assigning rs to other var, but not attr', () => {
      expect(compileCheckScopes(writer, 'other = rs')).to.equal('other = rs;');
      input = 'other.key = 1';
      try {
        compileCheckScopes(writer, input);
      } catch (err) {
        expect(err.name).to.be.equal('MongoshInvalidInputError');
        expect(err.code).to.be.equal(AsyncRewriterErrors.ModifyMongoshType);
      }
    });
    it('ok to reassign', () => {
      expect(compileCheckScopes(writer, 'other = rs')).to.equal('other = rs;');
      expect(compileCheckScopes(writer, 'other = 1')).to.equal('other = 1;');
      expect(compileCheckScopes(writer, 'other = rs.coll')).to.equal('other = rs.coll;');
      expect(compileCheckScopes(writer, 'other = db.coll')).to.equal('other = db.coll;');
    });
    it('not ok to reassign attribute', () => {
      expect(compileCheckScopes(writer, 'other = db.coll')).to.equal('other = db.coll;');
      input = 'other.insertOne = 1';
      try {
        compileCheckScopes(writer, input);
      } catch (err) {
        expect(err.name).to.be.equal('MongoshInvalidInputError');
        expect(err.code).to.be.equal(AsyncRewriterErrors.ModifyMongoshType);
      }
    });
    it('addToParent', () => {
      input = 'class rs {}';
      try {
        compileCheckScopes(writer, input);
      } catch (err) {
        expect(err.name).to.be.equal('MongoshInvalidInputError');
        expect(err.code).to.be.equal(AsyncRewriterErrors.ModifyMongoshType);
      }
    });
    it('updateIfDefined', () => {
      input = 'rs = 1';
      try {
        compileCheckScopes(writer, input);
      } catch (err) {
        expect(err.name).to.be.equal('MongoshInvalidInputError');
        expect(err.code).to.be.equal(AsyncRewriterErrors.ModifyMongoshType);
      }
    });
    it('does not error with db', () => {
      expect(compileCheckScopes(writer, 'db = 1')).to.equal('db = 1;');
    });
    it('updateAttribute', () => {
      input = 'rs.coll = 1';
      try {
        compileCheckScopes(writer, input);
      } catch (err) {
        expect(err.name).to.be.equal('MongoshInvalidInputError');
        expect(err.code).to.be.equal(AsyncRewriterErrors.ModifyMongoshType);
      }
    });
    it('var', () => {
      input = 'var rs = 1';
      try {
        compileCheckScopes(writer, input);
      } catch (err) {
        expect(err.name).to.be.equal('MongoshInvalidInputError');
        expect(err.code).to.be.equal(AsyncRewriterErrors.ModifyMongoshType);
      }
    });
    it('func', () => {
      input = 'function rs() { return 1; }';
      try {
        compileCheckScopes(writer, input);
      } catch (err) {
        expect(err.name).to.be.equal('MongoshInvalidInputError');
        expect(err.code).to.be.equal(AsyncRewriterErrors.ModifyMongoshType);
      }
    });
  });
  describe('recursion', () => {
    describe('non-async', () => {
      before(() => {
        spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
        writer = new AsyncWriter(signatures, spy);
        output = compileCheckScopes(writer, `
function f(arg) {
  if (arg === 'basecase') {
    return 1;
  }
  return f();
}
  `);
      });
      it('compiles correctly', () => {
        expect(output).to.equal(`function f(arg) {
  if (arg === 'basecase') {
    return 1;
  }

  return f();
}`);
      });
      it('symbol table final state is correct', () => {
        expect(skipPath(spy.lookup('f'))).to.deep.equal({
          type: 'function',
          returnsPromise: false,
          returnType: { type: 'unknown', attributes: {} }
        });
      });
    });
    describe('async', () => {
      before(() => {
        spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
        writer = new AsyncWriter(signatures, spy);
        output = compileCheckScopes(writer, `
function f(arg) {
  if (arg === 'basecase') {
    return db.coll.insertOne({});
  }
  return f();
}
  `);
      });
      it('compiles correctly', () => {
        expect(output).to.equal(`async function f(arg) {
  if (arg === 'basecase') {
    return await db.coll.insertOne({});
  }

  return f();
}`);
      });
      it('symbol table final state is correct', () => {
        expect(skipPath(spy.lookup('f'))).to.deep.equal({
          type: 'function',
          returnsPromise: true,
          returnType: { type: 'unknown', attributes: {} }
        });
      });
    });
    describe('hasAsyncChild', () => {
      before(() => {
        spy = sinon.spy(new SymbolTable([{ db: signatures.Database }, {}], signatures));
        writer = new AsyncWriter(signatures, spy);
      });
      it('throws', () => {
        try {
          compileCheckScopes(writer, `
function f(arg) {
  if (arg === 'basecase') {
    return db;
  }
  return f();
}
  `);
        } catch (e) {
          expect(e.name).to.equal('MongoshInvalidInputError');
          expect(e.code).to.be.equal(AsyncRewriterErrors.ConditionalReturn);
        }
      });
    });
  });
  describe('forEach', () => {
    beforeEach(() => {
      writer = new AsyncWriter(signatures);
      writer.symbols.initializeApiObjects({ db: signatures.Database });
    });
    describe('no async arguments', () => {
      it('forEach does not get translated', () => {
        input = 'arr.forEach((s) => (1))';
        expect(compileCheckScopes(writer, input)).to.equal('arr.forEach(s => 1);');
      });
      it('other function does not get translated', () => {
        input = 'arr.notForEach((s) => (1))';
        expect(compileCheckScopes(writer, input)).to.equal('arr.notForEach(s => 1);');
      });
    });
    describe('originally async arguments', () => {
      it('forEach does not get translated', () => {
        input = 'arr.forEach(async (s) => (1))';
        expect(compileCheckScopes(writer, input)).to.equal('arr.forEach(async s => 1);');
      });
      it('other function does not get translated', () => {
        input = 'arr.notForEach(async (s) => (1))';
        expect(compileCheckScopes(writer, input)).to.equal('arr.notForEach(async s => 1);');
      });
    });
    describe('transformed async arguments', () => {
      it('forEach with func arg does get translated', () => {
        input = 'arr.forEach((s) => ( db.coll.insertOne({}) ))';
        expect(compileCheckScopes(writer, input)).to.equal('await toIterator(arr).forEach(async s => await db.coll.insertOne({}));');
      });
      it('forEach with symbol arg does get translated', () => {
        expect(compileCheckScopes(writer, 'function f(s) { db.coll.insertOne(s) }')).to.equal(
          'async function f(s) {\n  await db.coll.insertOne(s);\n}'
        );
        input = 'arr.forEach(f)';
        expect(compileCheckScopes(writer, input)).to.equal('await toIterator(arr).forEach(f);');
      });
      it('other function throws', () => {
        input = 'arr.notForEach((s) => ( db.coll.insertOne({}) ) )';
        try {
          compileCheckScopes(writer, input);
        } catch (e) {
          expect(e.name).to.be.equal('MongoshInvalidInputError');
          expect(e.code).to.be.equal(AsyncRewriterErrors.ApiTypeAsFunctionArgument);
        }
      });
    });
  });
});
