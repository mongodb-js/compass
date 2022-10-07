import * as babelParser from '@babel/parser';
import { expect } from 'chai';
import {
  generate
} from './utils';

describe('PipelineParser Utils', function () {
  it('generates pretty code', function () {
    const pipeline = generate(
      babelParser.parseExpression(`[// Stage comment \n{$match: {name: /berlin/i, country: 'Germany'}}]`)
    );
    expect(pipeline).to.equal([
      '[',
      '  // Stage comment',
      '  {',
      '    $match: {',
      '      name: /berlin/i,',
      '      country: "Germany",',
      '    },',
      '  },',
      ']',
    ].join('\n'));
  });
});