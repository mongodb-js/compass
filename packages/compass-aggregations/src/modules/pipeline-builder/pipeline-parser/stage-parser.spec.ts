import * as babelParser from '@babel/parser';
import { expect } from 'chai';
import StageParser, {
  assertStageNode,
  getStageOperatorFromNode,
  getStageValueFromNode,
  isNodeDisabled,
  setNodeDisabled,
  stageToAstComments,
} from './stage-parser';
import type { StageLike } from './stage-parser';
import { generate } from './utils';

describe('StageParser', function () {
  describe('Stage node helpers', function () {

    const stages = [
      {
        usecase: 'stage with object value',
        expression: `{$match: {name: /berlin/i}}`,
        operator: '$match',
        value: `{\n  name: /berlin/i,\n}`,
        isValid: true,
      },
      {
        usecase: 'stage with array value',
        expression: `{$concatArrays: ['tags1', 'tags2'] }`,
        operator: '$concatArrays',
        value: `["tags1", "tags2"]`,
        isValid: true,
      },
      {
        usecase: 'stage with scaler numerical value',
        expression: `{$count: 20}`,
        operator: '$count',
        value: `20`,
        isValid: true,
      },
      {
        usecase: 'stage with scaler string value',
        expression: `{$unwind: 'tags'}`,
        operator: '$unwind',
        value: `"tags"`,
        isValid: true,
      },

      {
        usecase: 'stage with object value with comments',
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
        usecase: 'stage with scaler value with comments',
        expression: `{$count: 20 //limits doc count\n }`,
        operator: '$count',
        value: `20 //limits doc count`,
        isValid: true,
      },

      {
        usecase: 'object with more then one stage key',
        expression: `{$match: {name: /berlin/i}, $count: 20}`,
        operator: '',
        isValid: false,
      },
      {
        usecase: 'stage name without $',
        expression: `{match: {name: /berlin/i}, }`,
        operator: '',
        isValid: false,
      },
    ];

    it('sets node disabled prop', function () {
      const node = babelParser.parseExpression(`{$match: {name: /berlin/i}}`);

      setNodeDisabled(node, true);
      expect(isNodeDisabled(node)).to.be.true;

      setNodeDisabled(node, false);
      expect(isNodeDisabled(node)).to.be.false;
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
      stages.filter(x => x.isValid).forEach(({ expression, usecase, operator }) => {
        expect(getStageOperatorFromNode(
          babelParser.parseExpression(expression) as any),
          usecase
        ).to.equal(operator);
      });
    });

    it('stage value from node', function () {
      stages.filter(x => x.isValid).forEach(({ expression, usecase, value }) => {
        expect(getStageValueFromNode(
          babelParser.parseExpression(expression) as any),
          usecase
        ).to.equal(value);
      });
    });

    it('converts stage to comment', function () {
      const stage = babelParser.parseExpression(`{$match: {name: /berlin/i}}`);
      const comments = stageToAstComments(stage);
      comments.forEach(({ type }) => expect(type).to.equal('CommentLine'));
      const value = comments.map(({ value }) => value).join('\n');
      expect(value).to.equal([
        ' {',
        '   $match: {',
        '     name: /berlin/i,',
        '   },',
        ' }',
      ].join('\n'));
    });
  });

  describe('Stage Parsing', function () {
    let stageParser: StageParser;

    beforeEach(function () {
      stageParser = new StageParser();
    });

    it('object value', function () {
      const lines = [
        '// $match stage comment',
        '{$match: {',
        '// stage comment',
        'name: "berlin"',
        '// filters data on berlin',
        '}}',
      ];


      let counter = 0;
      let visitedLines = '';

      expect(stageParser.source).to.equal(visitedLines);

      while (counter < 5) {
        const line = lines[counter];
        visitedLines += `${line}\n`;
        const isStageLike = stageParser.push(line);
        expect(stageParser.source).to.equal(visitedLines);
        expect(isStageLike).to.be.false;
        counter++;
      }

      const stage = stageParser.push(lines[5]) as StageLike;
      expect(stageParser.source).to.equal('');

      expect(getStageOperatorFromNode(stage)).to.equal('$match');
      expect(getStageValueFromNode(stage)).to.equal([
        '{',
        '  // stage comment',
        '  name: "berlin",',
        '  // filters data on berlin',
        '}',
      ].join('\n'));
    });

    it('array value', function () {
      const lines = [
        '{$concatArrays: [',
        '// concat tags together',
        '"tags1", "tags2"',
        ']}',
      ];

      stageParser.push(lines[0]);
      stageParser.push(lines[1]);
      stageParser.push(lines[2]);

      const stage = stageParser.push(lines[3]) as StageLike;
      expect(stageParser.source).to.equal('');

      expect(getStageOperatorFromNode(stage)).to.equal('$concatArrays');
      expect(getStageValueFromNode(stage)).to.equal([
        '[',
        '  // concat tags together',
        '  "tags1",',
        '  "tags2",',
        ']',
      ].join('\n'));
    });

    it('numeric value', function () {
      const lines = [
        '{$limit: ',
        '// stage comment',
        '20',
        '// limits data',
        '}',
      ];

      stageParser.push(lines[0]);
      stageParser.push(lines[1]);
      stageParser.push(lines[2]);
      stageParser.push(lines[3]);

      const stage = stageParser.push(lines[4]) as StageLike;
      expect(stageParser.source).to.equal('');

      expect(getStageOperatorFromNode(stage)).to.equal('$limit');
      expect(getStageValueFromNode(stage)).to.equal([
        '// stage comment',
        '20',
        '// limits data',
      ].join('\n'));
    });

    it('string value', function () {
      const lines = [
        '{$unwind: ',
        '// stage comment',
        '"tags"',
        '// unfolds array',
        '}',
      ];

      stageParser.push(lines[0]);
      stageParser.push(lines[1]);
      stageParser.push(lines[2]);
      stageParser.push(lines[3]);

      const stage = stageParser.push(lines[4]) as StageLike;
      expect(stageParser.source).to.equal('');

      expect(getStageOperatorFromNode(stage)).to.equal('$unwind');
      expect(getStageValueFromNode(stage)).to.equal([
        '// stage comment',
        '"tags"',
        '// unfolds array',
      ].join('\n'));
    });

    it('block comments', function () {
      const lines = [
        '{$match: {',
        '/* stage comment */',
        'name: "berlin"',
        '/**',
        ' * filters data on berlin',
        ' **/',
        '}}',
      ];


      stageParser.push(lines[0]);
      stageParser.push(lines[1]);
      stageParser.push(lines[2]);
      stageParser.push(lines[3]);
      stageParser.push(lines[4]);
      stageParser.push(lines[5]);

      const stage = stageParser.push(lines[6]) as StageLike;
      expect(stageParser.source).to.equal('');

      expect(getStageOperatorFromNode(stage)).to.equal('$match');
      expect(getStageValueFromNode(stage)).to.equal([
        '{',
        '  /* stage comment */',
        '  name: "berlin",',
        '  /**',
        '   * filters data on berlin',
        '   **/',
        '}',
      ].join('\n'));
    });

    it('multiple stages', function () {
      const lines = [
        '{$match: {',
        'name: "berlin"',
        '}}',
        '{$unwind: "tags"}',
      ];


      expect(stageParser.source).to.equal('');

      stageParser.push(lines[0]);
      stageParser.push(lines[1]);

      let stage = stageParser.push(lines[2]) as StageLike;
      expect(stageParser.source).to.equal('');

      expect(getStageOperatorFromNode(stage)).to.equal('$match');
      expect(getStageValueFromNode(stage)).to.equal([
        '{',
        '  name: "berlin",',
        '}',
      ].join('\n'));


      stage = stageParser.push(lines[3]) as StageLike;
      expect(stageParser.source).to.equal('');
      expect(getStageOperatorFromNode(stage)).to.equal('$unwind');
      expect(getStageValueFromNode(stage)).to.equal('"tags"');
    });

    it('only valid stages', function () {
      const lines = [
        '{$match: {',
        'name: "berlin"',
        '}}',
        '{unwind: "tags"}', // Invalid stage
        '{$unwind: "tags", $limit: 10}', // Invalid stage
      ];


      expect(stageParser.source).to.equal('');

      stageParser.push(lines[0]);
      stageParser.push(lines[1]);

      const stage = stageParser.push(lines[2]) as StageLike;
      expect(stageParser.source).to.equal('');

      expect(getStageOperatorFromNode(stage)).to.equal('$match');
      expect(getStageValueFromNode(stage)).to.equal([
        '{',
        '  name: "berlin",',
        '}',
      ].join('\n'));


      let isStage = stageParser.push(lines[3]);
      expect(isStage).to.be.false;
      expect(stageParser.source).to.equal(`// ${lines[3]}\n`);

      isStage = stageParser.push(lines[4]);
      expect(isStage).to.be.false;
      expect(stageParser.source).to.equal(`// ${lines[3]}\n// ${lines[4]}\n`);
    });

    it('should treat non-stage-like object expressions as comments', function () {
      const code = `{
  foo: 1
},
{
  $match: { _id: 1 }
}`;

      let stage: any;

      code.split('\n').forEach((line) => {
        const maybeStage = stageParser.push(line);
        if (maybeStage) {
          stage = maybeStage;
        }
      });

      expect(generate(stage)).to.eq(`// {
//   foo: 1
// },
{
  $match: {
    _id: 1,
  },
}`);
    });

    it('should parse stages that start and end at the same line', function () {
      const code = `{
  $match: { _id: 1 }
}, {
  $limit: 10
}`;

      const stages: StageLike[] = [];

      code.split('\n').forEach((line) => {
        const maybeStage = stageParser.push(line);
        if (maybeStage) {
          stages.push(maybeStage);
        }
      });

      expect(stages).to.have.lengthOf(2);

      expect(generate(stages[0])).to.eq(`{
  $match: {
    _id: 1,
  },
}`);

      expect(generate(stages[1])).to.eq(`{
  $limit: 10,
}`);
    });
  });
});