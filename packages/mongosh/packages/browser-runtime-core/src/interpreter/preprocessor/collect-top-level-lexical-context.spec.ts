import { expect } from 'chai';
import { parse } from '@babel/parser';

import { collectTopLevelLexicalContext } from './collect-top-level-lexical-context';

describe('collectTopLevelLexicalContext', () => {
  const testCollectTopLevelLexicalContext =
    (code: string): object => collectTopLevelLexicalContext(parse(code));

  it('collects top level class declarations', () => {
    expect(testCollectTopLevelLexicalContext('class A {}'))
      .to.deep.equal({ A: 'class' });
  });

  it('does not collect internal class declarations', () => {
    expect(testCollectTopLevelLexicalContext('() => { class A {} }'))
      .to.deep.equal({});
  });

  it('collects top level function declaration', () => {
    expect(testCollectTopLevelLexicalContext('function a() {}'))
      .to.deep.equal({ a: 'function' });
  });

  it('does not collect internal function declarations', () => {
    expect(testCollectTopLevelLexicalContext('() => { function a() {} }'))
      .to.deep.equal({});
  });

  it('collects top level "let" declarations without assignment', () => {
    expect(testCollectTopLevelLexicalContext('let x'))
      .to.deep.equal({ x: 'let' });
  });

  it('does not collect top level assignment', () => {
    expect(testCollectTopLevelLexicalContext('x = 2'))
      .to.deep.equal({});
  });

  it('does not collect internal declarations', () => {
    expect(testCollectTopLevelLexicalContext('{let x = 2;}'))
      .to.deep.equal({});
  });

  ['let', 'const'].forEach((kind) => {
    it(`collects top level "${kind}" declarations`, () => {
      expect(testCollectTopLevelLexicalContext(`${kind} x = 2`))
        .to.deep.equal({ x: kind });
    });

    it(`collects multiple "${kind}" declarations`, () => {
      expect(testCollectTopLevelLexicalContext(`${kind} x = 2, y = 5`))
        .to.deep.equal({ x: kind, y: kind });
    });

    it(`collects top level "${kind}" object destructuring`, () => {
      expect(testCollectTopLevelLexicalContext(`${kind} {x} = {}`))
        .to.deep.equal({ x: kind });
    });

    it(`collects top level "${kind}" object destructuring multiple vars`, () => {
      expect(testCollectTopLevelLexicalContext(`${kind} {x, y} = {}`))
        .to.deep.equal({ x: kind, y: kind });
    });

    it(`collects top level "${kind}" object destructuring and renaming`, () => {
      expect(testCollectTopLevelLexicalContext(`${kind} {x: z, y} = {}`))
        .to.deep.equal({ z: kind, y: kind });
    });

    it(`collects top level "${kind}" nested object destructuring`, () => {
      expect(testCollectTopLevelLexicalContext(`${kind} {k: {f: b}} = {k: {f: 2}}`))
        .to.deep.equal({ b: kind });
    });

    it(`collects top level "${kind}" object destructuring multiple vars with rest`, () => {
      expect(testCollectTopLevelLexicalContext(`${kind} {x, ...y} = {}`))
        .to.deep.equal({ x: kind, y: kind });
    });

    it(`collects top level "${kind}" array destructuring`, () => {
      expect(testCollectTopLevelLexicalContext(`${kind} [x] = []`))
        .to.deep.equal({ x: kind });
    });

    it(`collects top level "${kind}" array destructuring multiple vars`, () => {
      expect(testCollectTopLevelLexicalContext(`${kind} [x, y] = []`))
        .to.deep.equal({ x: kind, y: kind });
    });

    it(`collects top level "${kind}" array destructuring skip var`, () => {
      expect(testCollectTopLevelLexicalContext(`${kind} [, y] = []`))
        .to.deep.equal({ y: kind });
    });

    it(`collects top level "${kind}" array destructuring multiple vars with rest`, () => {
      expect(testCollectTopLevelLexicalContext(`${kind} [x, ...y] = []`))
        .to.deep.equal({ x: kind, y: kind });
    });

    it(`collects top level complex "${kind}" declaration`, () => {
      expect(
        testCollectTopLevelLexicalContext(
          `${kind} {a: {b: [,c,{d, ...e}]}} = {a: {b: [1, 2, {d: 3, e: 4, f: 5}]}}`
        )
      ).to.deep.equal({ c: kind, d: kind, e: kind });
    });

    it(`collects top level "${kind}" object destructuring with defaults`, () => {
      expect(
        testCollectTopLevelLexicalContext(
          `${kind} {a: {b = 1} = {}} = {}`
        )
      ).to.deep.equal({ b: kind });
    });

    it(`collects top level "${kind}" array destructuring with defaults`, () => {
      expect(
        testCollectTopLevelLexicalContext(
          `${kind} [a = 1] = []`
        )
      ).to.deep.equal({ a: kind });
    });
  });
});
