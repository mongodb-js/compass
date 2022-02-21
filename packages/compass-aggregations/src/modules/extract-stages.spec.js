import { extractStages } from './extract-stages';
import { expect } from 'chai';

const expectedInvalidPipelineError =
  'Unable to extract pipeline stages: the provided input is not an array of objects';

describe('extractStages', function() {
  it('extracts a stage from pipeline text', function() {
    const stages = extractStages('[{ $match: {x: 1} }]');
    expect(stages).to.deep.equal([{
      operator: '$match',
      source: `{
  x: 1
}`
    }]);
  });

  it('extracts a stage from pipeline text (stage name has double-quotes)', function() {
    const stages = extractStages('[{ "$match": {x: 1} }]');
    expect(stages).to.deep.equal([{
      operator: '$match',
      source: `{
  x: 1
}`
    }]);
  });

  it('extracts a stage from pipeline text (stage name has single-quotes)', function() {
    const stages = extractStages('[{ \'$match\': {x: 1} }]');
    expect(stages).to.deep.equal([{
      operator: '$match',
      source: `{
  x: 1
}`
    }]);
  });

  it('allows an empty array', function() {
    const stages = extractStages('[]');
    expect(stages).to.deep.equal([]);
  });

  it('allows multiple stages', function() {
    const stages = extractStages('[{ x: 1 }, {y: 2}]');
    expect(stages).to.deep.equal([{
      operator: 'x',
      source: '1'
    },
    {
      operator: 'y',
      source: '2'
    }]);
  });

  [
    ['empty input', ''],
    ['not an array', '1'],
    ['single stage', '{x: {}}'],
    ['multiple blocks', '[]; []'],
    ['not an array of objects', '[1, 2, 3]'],
    ['invalid stage (no properties)', '[{}]'],
    ['invalid stage (too many properties)', '[{x: 1, y: 2}]'],
  ].forEach(([label, input]) => {
    it(`throws with invalid source: ${label}`, function() {
      expect(
        () => extractStages(input)
      ).to.throw(expectedInvalidPipelineError);
    });
  });
});
