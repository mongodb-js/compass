import { expect } from 'chai';
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import { wrapInAsyncFunctionCall } from './wrap-in-async-function-call';

describe('wrapInAsyncFunctionCall', () => {
  const testAllowTopLevelAwait = (code: string): string => {
    const ast = wrapInAsyncFunctionCall(parse(code));
    return generate(ast as any).code;
  };

  it('wraps code in function call', () => {
    expect(testAllowTopLevelAwait('1')).to.equal('(async () => {\n  1;\n})();');
  });
});
