import { expect } from 'chai';

import { parse } from '@babel/parser';
import generate from '@babel/generator';

import { injectLastExpressionCallback } from './inject-last-expression-callback';

describe('injectLastExpressionCallback', () => {
  const testInjectLastExpressionCallback = (code: any): string => {
    const ast = injectLastExpressionCallback('mongodbEvalCapture', parse(code));
    return generate(ast as any).code;
  };

  it('captures literals', () => {
    expect(testInjectLastExpressionCallback('5'))
      .to.equal('mongodbEvalCapture(5);');
  });

  it('captures function calls', () => {
    expect(testInjectLastExpressionCallback('f()'))
      .to.equal('mongodbEvalCapture(f());');
  });

  it('captures function declarations', () => {
    expect(testInjectLastExpressionCallback('function f() {}'))
      .to.equal('function f() {}\n\nmongodbEvalCapture(f);');
  });

  it('captures class declarations', () => {
    expect(testInjectLastExpressionCallback('class C {}'))
      .to.equal('class C {}\n\nmongodbEvalCapture(C);');
  });

  it('captures global assignments', () => {
    expect(testInjectLastExpressionCallback('x = 5'))
      .to.equal('mongodbEvalCapture(x = 5);');
  });

  it('captures string literals', () => {
    expect(testInjectLastExpressionCallback(';\'str\''))
      .to.equal(';\nmongodbEvalCapture(\'str\');');
  });

  it('captures undefined if the last statement is not an expression', () => {
    expect(testInjectLastExpressionCallback('let x = 5'))
      .to.equal('let x = 5;\nmongodbEvalCapture();');
  });

  it('captures undefined the program is empty', () => {
    expect(testInjectLastExpressionCallback(''))
      .to.equal('mongodbEvalCapture();');
  });
});
