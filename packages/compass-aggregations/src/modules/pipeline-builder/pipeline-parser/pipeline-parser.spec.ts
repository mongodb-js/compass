import { expect } from 'chai';
import PipelineParser from './pipeline-parser';

const pipelines = [
  {
    usecase: 'no stage disabled',
    input: `[{$unwind: "users"}]`,
    output: `[
  {
    $unwind: "users",
  },
]`
  },
  {
    usecase: 'all stages disabled',
    input: `[\n//{$unwind: "users"},\n // {$limit: 20}\n]`,
    output: `[
  // {
  //   $unwind: "users",
  // }
  // {
  //   $limit: 20,
  // }
]`
  },
  {
    usecase: 'enabled first and last stage',
    input: `[{$unwind: "users"},\n // {$limit: 20},\n {$sort: {name: -1}}]`,
    output: `[
  {
    $unwind: "users",
  }, // {
  //   $limit: 20,
  // }
  {
    $sort: {
      name: -1,
    },
  },
]`,
  },
  {
    usecase: 'last stage disabled',
    input: `[{$unwind: "users"},{$limit: 20},\n// {$sort: {name: -1}}\n]`,
    output: `[
  {
    $unwind: "users",
  },
  {
    $limit: 20,
  }, // {
  //   $sort: {
  //     name: -1,
  //   },
  // }
]`
  },
  {
    usecase: 'only last stage enabled',
    input: `[// {$match: {}}\n // {$unwind: "users"}, \n {$limit: 20}\n]`,
    output: `[
  // {
  //   $match: {},
  // }
  // {
  //   $unwind: "users",
  // }
  {
    $limit: 20,
  },
]`,
  },
  {
    usecase: 'pipeline with no stage and only comments',
    input: `[\n // $match filters data \n]`,
    output: `[
  // $match filters data
]`
  },
];

describe('PipelineParser', function () {
  describe('parses text', function () {
    it('throws if pipeline is not a valid array', function () {
      [``, '{}', 'hello', '20'].forEach(expression => {
        expect(() => {
          PipelineParser.parse(expression);
        }).to.throw;
      });
      expect(() => {
        PipelineParser.parse(`[]`);
      }).to.not.throw;
    });
    it('parses commented out pipeline', function () {
      const pipeline = `[
      // {$unwind: "users"},
      // {$limit: 20},
      // {$skip: 100},
    ]`;
      const { stages } = PipelineParser.parse(pipeline);
      expect(stages.length).to.equal(3);
    });
    it('parses a pipeline', function () {
      const pipeline = `[
      { $match: { name: /berlin/i } },
      { $unwind: "users" },
        // {$limit: 20},
        // {$skip: 100},
      ]`;
      const { stages } = PipelineParser.parse(pipeline);
      expect(stages.length).to.equal(4);
    });
  });
  describe('validates text', function () {
    it('throws if pipeline is not a valid array', function () {
      [``, '{}', 'hello', '20'].forEach(expression => {
        const { errors } = PipelineParser.validate(expression);
        expect(errors[0]).to.be.instanceOf(SyntaxError);
      });
    });
    it('validates array stages', function () {
      const pipeline = `[
      { $match: { name: /berlin/i } },
      { limit: 20 },
      { $skip: 20, $limit: 30 },
      ]`;

      const { errors } = PipelineParser.validate(pipeline);
      expect(errors.length).to.equal(2);
      errors.forEach(x => expect(x).to.be.instanceOf(SyntaxError));
    });
  });
  it('generates pipeline string', function () {
    pipelines.forEach(({ input, output, usecase }) => {
      const { root, stages } = PipelineParser.parse(input);
      const generatedPipelineString = PipelineParser.generate(root, stages);
      expect(generatedPipelineString, usecase).to.equal(output);
    });
  });
});