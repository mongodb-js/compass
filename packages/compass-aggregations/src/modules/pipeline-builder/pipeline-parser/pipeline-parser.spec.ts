import { expect } from 'chai';
import PipelineParser from './pipeline-parser';
import Stage from '../stage'

const pipelines = [
  {
    usecase: 'no stage disabled',
    input: `[{$unwind: "users"}]`,
    output: `[
  {
    $unwind: "users",
  },
]`,
    pipeline: [
      {
        stage: {
          $unwind: 'users'
        },
        disabled: false
      }
    ]
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
]`,
    pipeline: [
      {
        stage: {
          $unwind: 'users'
        },
        disabled: true
      },
      {
        stage: {
          $limit: 20
        },
        disabled: true
      }
    ]
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
    pipeline: [
      {
        stage: {
          $unwind: 'users'
        },
        disabled: false
      },
      {
        stage: {
          $limit: 20
        },
        disabled: true
      },
      {
        stage: {
          $sort: {
            name: -1
          }
        },
        disabled: false
      }
    ]
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
]`,
    pipeline: [
      {
        stage: {
          $unwind: 'users'
        },
        disabled: false
      },
      {
        stage: {
          $limit: 20
        },
        disabled: false
      },
      {
        stage: {
          $sort: {
            name: -1
          }
        },
        disabled: true
      }
    ]
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
    pipeline: [
      {
        stage: {
          $match: {}
        },
        disabled: true
      },
      {
        stage: {
          $unwind: 'users'
        },
        disabled: true
      },
      {
        stage: {
          $limit: 20
        },
        disabled: false
      }
    ]
  },
  {
    usecase: 'pipeline with no stage and only comments',
    input: `[\n // $match filters data \n]`,
    output: `[
  // $match filters data
]`,
    pipeline: []
  },
  {
    usecase:
      'COMPASS-6426: comments are correctly added to the corresponding stages',
    input: `[
  // {
  //   $match: {
  //     name: {
  //       $in: [/ber/i, /bas/i],
  //     },
  //     bathrooms: {
  //       $gte: 2,
  //     },
  //   },
  // },
  // {
  //   where: {
  //     name: 'berlin',
  //   },
  // }
  {
    $project: {
      _id: 1,
      name: 1,
      bathrooms: 1,
    },
  },
  // Another comment
  {
    // Fixed the bug
    $sort: {
      bathrooms: -1,
    },
  },
  {
    $skip: 1,
  },
  {
    // This should not go away!
    $limit: 8,
  },
]`,
    output: `[
  // {
  //   $match: {
  //     name: {
  //       $in: [/ber/i, /bas/i],
  //     },
  //     bathrooms: {
  //       $gte: 2,
  //     },
  //   },
  // }
  // {
  //   where: {
  //     name: 'berlin',
  //   },
  // }
  {
    $project: {
      _id: 1,
      name: 1,
      bathrooms: 1,
    },
  },
  // Another comment
  {
    // Fixed the bug
    $sort: {
      bathrooms: -1,
    },
  },
  {
    $skip: 1,
  },
  {
    // This should not go away!
    $limit: 8,
  },
]`,
    pipeline: [
      {
        stage: {
          $match: {
            name: {
              $in: [/ber/i, /bas/i]
            },
            bathrooms: {
              $gte: 2
            }
          }
        },
        disabled: true
      },
      {
        stage: {
          $project: {
            _id: 1,
            name: 1,
            bathrooms: 1
          }
        },
        disabled: false
      },
      {
        stage: {
          // Fixed the bug
          $sort: {
            bathrooms: -1
          }
        },
        disabled: false
      },
      {
        stage: {
          $skip: 1
        },
        disabled: false
      },
      {
        stage: {
          // This should not go away!
          $limit: 8
        },
        disabled: false
      }
    ]
  },
  {
    usecase:
      'COMPASS-6426: commented out non-stage-like object expressions are ignored',
    input: `[
  // {
  //   $match: {
  //     name: {
  //       $in: [/ber/i, /bas/i],
  //     },
  //     bathrooms: {
  //       $gte: 2,
  //     },
  //   },
  // },
  // {
  //   where: {
  //     name: 'berlin',
  //   },
  // }
  // {
  //   $project: {
  //     _id: 1,
  //     name: 1,
  //     bathrooms: 1,
  //   },
  // },
  // Another comment
  {
    // Fixed the bug
    $sort: {
      bathrooms: -1,
    },
  },
  {
    $skip: 1,
  },
  {
    // This should not go away!
    $limit: 8,
  },
]`,
    output: `[
  // {
  //   $match: {
  //     name: {
  //       $in: [/ber/i, /bas/i],
  //     },
  //     bathrooms: {
  //       $gte: 2,
  //     },
  //   },
  // }
  // {
  //   where: {
  //     name: 'berlin',
  //   },
  // }
  // {
  //   $project: {
  //     _id: 1,
  //     name: 1,
  //     bathrooms: 1,
  //   },
  // }
  // Another comment
  {
    // Fixed the bug
    $sort: {
      bathrooms: -1,
    },
  },
  {
    $skip: 1,
  },
  {
    // This should not go away!
    $limit: 8,
  },
]`,
    pipeline: [
      {
        stage: {
          $match: {
            name: {
              $in: [/ber/i, /bas/i]
            },
            bathrooms: {
              $gte: 2
            }
          }
        },
        disabled: true
      },
      {
        stage: {
          $project: {
            _id: 1,
            name: 1,
            bathrooms: 1
          }
        },
        disabled: true
      },
      {
        stage: {
          // Fixed the bug
          $sort: {
            bathrooms: -1
          }
        },
        disabled: false
      },
      {
        stage: {
          $skip: 1
        },
        disabled: false
      },
      {
        stage: {
          // This should not go away!
          $limit: 8
        },
        disabled: false
      }
    ]
  }
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
  describe('generates pipeline string', function () {
    pipelines.forEach(({ input, output, pipeline, usecase }) => {
      it(usecase, function () {
        const { root, stages } = PipelineParser.parse(input);
        expect(stages).to.have.lengthOf(pipeline.length);
        stages.forEach((node, index) => {
          const stage = new Stage(node)
          expect(
            stage.disabled,
            `expected ${stage.operator} stage to be ${
              pipeline[index].disabled ? 'disabled' : 'enabled'
            }`
          ).to.eq(pipeline[index].disabled);
          expect(stage.toBSON()).to.deep.eq(
            stage.disabled ? null : pipeline[index].stage
          );
        })
        const generatedPipelineString = PipelineParser.generate(root, stages);
        expect(generatedPipelineString).to.equal(output);
      });
    });
  });
});
