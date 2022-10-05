import * as babelParser from '@babel/parser';
import { expect } from 'chai';
import {
  assertStageNode,
  generate,
  getStageOperatorFromNode,
  getStageValueFromNode,
  isDisabled,
  isStageLike,
  setDisabled
} from './pipeline-parser';

describe('PipelineParser', function () {

  describe('Stage node', function () {

    const stages = [
      {
        useCase: 'stage with object value',
        expression: `{$match: {name: /berlin/i}}`,
        operator: '$match',
        value: `{\n  name: /berlin/i,\n}`,
        isValid: true,
      },
      {
        useCase: 'stage with array value',
        expression: `{$concatArrays: ['tags1', 'tags2'] }`,
        operator: '$concatArrays',
        value: `["tags1", "tags2"]`,
        isValid: true,
      },
      {
        useCase: 'stage with scaler numerical value',
        expression: `{$count: 20}`,
        operator: '$count',
        value: `20`,
        isValid: true,
      },
      {
        useCase: 'stage with scaler string value',
        expression: `{$unwind: 'tags'}`,
        operator: '$unwind',
        value: `"tags"`,
        isValid: true,
      },

      {
        useCase: 'stage with object value with comments',
        expression: `
          {
            $match: {
              // $match filters data
              name: /berlin/i
            }
            /* $match corresponds to sql where */
          }`,
        operator: '$match',
        value: `{
  // $match filters data
  name: /berlin/i,
}
/* $match corresponds to sql where */`,
        isValid: true,
      },
      {
        useCase: 'stage with scaler value with comments',
        expression: `{$count: 20 //limits doc count\n }`,
        operator: '$count',
        value: `20 //limits doc count`,
        isValid: true,
      },

      {
        useCase: 'object with more then one stage key',
        expression: `{$match: {name: /berlin/i}, $count: 20}`,
        operator: '',
        isValid: false,
      },
      {
        useCase: 'stage name without $',
        expression: `{match: {name: /berlin/i}, }`,
        operator: '',
        isValid: false,
      },
    ];

    it('sets node disabled prop', function () {
      const node = babelParser.parseExpression(`{$match: {name: /berlin/i}}`);

      setDisabled(node, true);
      expect(isDisabled(node)).to.be.true;

      setDisabled(node, false);
      expect(isDisabled(node)).to.be.false;
    });

    it('checks if node is a stage', function () {
      stages.forEach(({ isValid, expression, useCase }) => {
        expect(isStageLike(
          babelParser.parseExpression(expression)),
          useCase
        ).to.equal(isValid);
      });
    });

    it('asserts stage node', function () {
      const data = [
        {
          expression: `[]`,
          errorMessage: 'Each element of the pipeline array must be an object',
        },
        {
          expression: `'name'`,
          errorMessage: 'Each element of the pipeline array must be an object',
        },
        {
          expression: `{}`,
          errorMessage: 'A pipeline stage specification object must contain exactly one field.',
        },
        {
          expression: `{match: {}}`,
          errorMessage: 'Stage value can not be empty',
        },
      ];
      data.forEach(({ expression, errorMessage }) => {
        try {
          assertStageNode(babelParser.parseExpression(expression))
        } catch (e) {
          expect(e).to.be.instanceOf(SyntaxError);
          expect((e as SyntaxError).message).to.equal(errorMessage);
        }
      });

      stages.filter(x => x.isValid).forEach(({ expression }) => {
        assertStageNode(babelParser.parseExpression(expression));
      });
    });

    it('stage operator from node', function () {
      stages.filter(x => x.isValid).forEach(({ expression, useCase, operator }) => {
        expect(getStageOperatorFromNode(
          babelParser.parseExpression(expression) as any),
          useCase
        ).to.equal(operator);
      });
    });

    it('stage value from node', function () {
      stages.filter(x => x.isValid).forEach(({ expression, useCase, value }) => {
        expect(getStageValueFromNode(
          babelParser.parseExpression(expression) as any),
          useCase
        ).to.equal(value);
      });
    });
  });

  it('generates pretty code', function () {
    const pipeline = generate(
      babelParser.parseExpression(`[// Stage comment \n{$match: {name: /berlin/i, country: 'Germany'}}]`)
    );
    expect(pipeline).to.equal(`[
  // Stage comment
  {
    $match: {
      name: /berlin/i,
      country: "Germany",
    },
  },
]`
    );

  });
});
