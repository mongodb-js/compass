import { extractStages } from './extract-stages';

const expectedInvalidPipelineError =
  'Unable to extract pipeline stages: the provided input is not an array of objects';

describe('extractStages', () => {
  it('extracts a stage from pipeline text', () => {
    const stages = extractStages('[{ $match: {x: 1} }]');
    expect(stages).to.deep.equal([{
      operator: '$match',
      source: `{
  x: 1
}`
    }]);
  });

  it('allows an empty array', () => {
    const stages = extractStages('[]');
    expect(stages).to.deep.equal([]);
  });

  it('allows multiple stages', () => {
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
    it(`throws with invalid source: ${label}`, () => {
      expect(
        () => extractStages(input)
      ).to.throw(expectedInvalidPipelineError);
    });
  });
});
