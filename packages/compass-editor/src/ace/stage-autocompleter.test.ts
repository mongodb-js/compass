import { expect } from 'chai';
import {
  CONVERSION_OPERATORS,
  EXPRESSION_OPERATORS,
} from '@mongodb-js/mongodb-constants';
import { StageAutoCompleter } from './stage-autocompleter';
import type { CompletionWithServerInfo } from '../types';
import { setupCompleter } from '../../test/completer';

const ALL_OPS = ([] as CompletionWithServerInfo[])
  .concat(EXPRESSION_OPERATORS, CONVERSION_OPERATORS)
  .map((completion) => {
    return {
      value: completion.value,
      meta: completion.meta,
      score: completion.score,
    };
  })
  .filter((completion) => completion.meta !== 'accumulator')
  .sort(sortCompletions);

const setupStageCompleter = setupCompleter.bind(null, StageAutoCompleter);

function sortCompletions(
  a: { value: string; meta?: string },
  b: { value: string; meta?: string }
) {
  const metaSort = a.meta!.localeCompare(b.meta!);
  const valueSort = a.value.localeCompare(b.value);
  return metaSort !== 0 ? metaSort : valueSort;
}

describe('StageAutoCompleter', function () {
  const fields = [
    {
      name: 'name',
      score: 1,
      meta: 'field',
    },
  ];

  describe('#getCompletions', function () {
    context('when the current token is a string', function () {
      context('when there are no previous autocompletions', function () {
        const { getCompletions } = setupStageCompleter('', {
          fields,
          serverVersion: '3.4.0',
          stageOperator: null,
        });

        it('returns no results', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([]);
          });
        });
      });

      context('when there are previous autocompletions', function () {
        context('when the latest token is a string', function () {
          const { getCompletions } = setupStageCompleter('{ $project: { "$', {
            fields,
            serverVersion: '3.4.0',
            stageOperator: null,
          });

          it('returns the field names', function () {
            getCompletions((error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  meta: 'field:reference',
                  score: 1,
                  value: '$name',
                },
              ]);
            });
          });
        });
      });

      context('when the previous token is an accumulator', function () {
        const { getCompletions } = setupStageCompleter(
          '{ _id: null, avgDur: { $avg: "$',
          { fields, serverVersion: '3.6.0', stageOperator: null }
        );

        it('returns the field names', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([
              {
                meta: 'field:reference',
                score: 1,
                value: '$name',
              },
            ]);
          });
        });
      });

      context('when the field names have special characters', function () {
        const oddFields = [
          {
            name: 'name.test',
            score: 1,
            meta: 'field:reference',
          },
          {
            name: 'name space',
            score: 1,
            meta: 'field:reference',
          },
        ];

        const { getCompletions } = setupStageCompleter(
          '{ _id: null, avgDur: { $avg: "$',
          { fields: oddFields, serverVersion: '3.6.0', stageOperator: null }
        );

        it('returns the field names without the quotes', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([
              {
                meta: 'field:reference',
                score: 1,
                value: '$name.test',
              },
              {
                meta: 'field:reference',
                score: 1,
                value: '$name space',
              },
            ]);
          });
        });
      });

      context('when there are tokens after', function () {
        context('when the latest token is a string', function () {
          const { getCompletions } = setupStageCompleter(
            '{ $match: { $and: [ "$var1", "$va',
            { fields, serverVersion: '3.4.0', stageOperator: null }
          );

          it.skip('returns only the previous results', function () {
            getCompletions((error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  caption: '$match',
                  meta: 'local',
                  score: 2,
                  value: '$match',
                },
                {
                  caption: '$and',
                  meta: 'local',
                  score: 3,
                  value: '$and',
                },
                {
                  caption: '$var1',
                  meta: 'local',
                  score: 4,
                  value: '$var1',
                },
              ]);
            });
          });
        });
      });
    });

    context('when the current token is an identifier', function () {
      context('when no stage operator has been defined', function () {
        context('when the version is not provided', function () {
          context('when the prefix is empty', function () {
            const { getCompletions } = setupStageCompleter('', {
              fields,
              serverVersion: '3.4.0',
              stageOperator: null,
            });

            it('returns no results', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([]);
              });
            });
          });

          context('when the prefix begins with a letter', function () {
            context('when the token is on the same line', function () {
              context(
                'when the token matches a BSON type or a field name',
                function () {
                  const { getCompletions } = setupStageCompleter('{ N', {
                    fields,
                    serverVersion: '3.6.0',
                    stageOperator: null,
                  });

                  it('returns all the matching field names', function () {
                    getCompletions((error, results) => {
                      expect(error).to.equal(null);
                      expect(results.map((r) => r.value)).to.deep.equal([
                        'NumberInt',
                        'NumberLong',
                        'NumberDecimal',
                        'name',
                      ]);
                    });
                  });
                }
              );
            });
          });

          context('when the prefix begins with $', function () {
            context('when the latest version of server', function () {
              const latestServer = '7.0.0';

              context('when the token is on the same line', function () {
                const { getCompletions } = setupStageCompleter('{ $', {
                  fields,
                  serverVersion: latestServer,
                  stageOperator: null,
                });

                it('returns all the expression operators', function () {
                  getCompletions((error, results) => {
                    expect(error).to.equal(null);
                    expect(results.sort(sortCompletions)).to.deep.equal(
                      ALL_OPS
                    );
                  });
                });
              });

              context('when the token is on another line', function () {
                const { getCompletions } = setupStageCompleter('{\n  $', {
                  fields,
                  serverVersion: latestServer,
                  stageOperator: null,
                });

                it('returns all the expression operators', function () {
                  getCompletions((error, results) => {
                    expect(error).to.equal(null);
                    expect(results.sort(sortCompletions)).to.deep.equal(
                      ALL_OPS
                    );
                  });
                });
              });

              context('when prerelease version', function () {
                const { getCompletions } = setupStageCompleter('{\n  $', {
                  fields,
                  serverVersion: `${latestServer}-rc0`,
                  stageOperator: null,
                });

                it('returns all the expression operators', function () {
                  getCompletions((error, results) => {
                    expect(error).to.equal(null);
                    expect(results.sort(sortCompletions)).to.deep.equal(
                      ALL_OPS
                    );
                  });
                });
              });
            });
          });

          context('when the prefix begins with an unknown', function () {
            const { getCompletions } = setupStageCompleter('{ $notAnOp', {
              fields,
              serverVersion: '3.4.0',
              stageOperator: null,
            });

            it('returns none of the expression operators', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([]);
              });
            });
          });

          context('when the server version is a RC', function () {
            const { getCompletions } = setupStageCompleter('{ $conv', {
              fields,
              serverVersion: '4.0.0-rc6',
              stageOperator: null,
            });

            it('returns the matching conversion operator', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    meta: 'conv',
                    score: 1,
                    value: '$convert',
                  },
                ]);
              });
            });
          });

          context('when the prefix begins with $a', function () {
            const { getCompletions } = setupStageCompleter('{ $a', {
              fields,
              serverVersion: '3.4.0',
              stageOperator: null,
            });

            it('returns all the expression operators starting with $a', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    value: '$abs',
                    score: 1,
                    meta: 'expr:arith',
                  },
                  {
                    value: '$add',
                    score: 1,
                    meta: 'expr:arith',
                  },
                  {
                    value: '$allElementsTrue',
                    score: 1,
                    meta: 'expr:set',
                  },
                  {
                    value: '$and',
                    score: 1,
                    meta: 'expr:bool',
                  },
                  {
                    value: '$anyElementTrue',
                    score: 1,
                    meta: 'expr:set',
                  },
                  {
                    value: '$arrayElemAt',
                    score: 1,
                    meta: 'expr:array',
                  },
                ]);
              });
            });
          });

          context('when the prefix begins with $co', function () {
            const { getCompletions } = setupStageCompleter('{ $co', {
              fields,
              serverVersion: '3.4.0',
              stageOperator: null,
            });

            it('returns all the expression operators starting with $co', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    value: '$concat',
                    score: 1,
                    meta: 'expr:string',
                  },
                  {
                    value: '$concatArrays',
                    score: 1,
                    meta: 'expr:array',
                  },
                  {
                    value: '$cond',
                    score: 1,
                    meta: 'expr:cond',
                  },
                ]);
              });
            });
          });

          context('when the prefix begins with $sec', function () {
            const { getCompletions } = setupStageCompleter('{ $sec', {
              fields,
              serverVersion: '3.4.0',
              stageOperator: null,
            });

            it('returns all the expression operators starting with $sec', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    value: '$second',
                    score: 1,
                    meta: 'expr:date',
                  },
                ]);
              });
            });
          });
        });

        context('when the version is provided', function () {
          const { getCompletions } = setupStageCompleter('{ $si', {
            fields,
            serverVersion: '3.0.0',
            stageOperator: null,
          });

          it('returns available operators for the version', function () {
            getCompletions((error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  value: '$size',
                  score: 1,
                  meta: 'expr:array',
                },
              ]);
            });
          });
        });
      });

      context('when a stage operator has been defined', function () {
        context('when the stage operator is $project', function () {
          context('when the server version is 3.2.0', function () {
            context('when the stage is a single line', function () {
              const { getCompletions } = setupStageCompleter('{ $m', {
                fields,
                serverVersion: '3.2.0',
                stageOperator: '$project',
              });

              it('returns matching expression operators + $project accumulators', function () {
                getCompletions((error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      value: '$max',
                      score: 1,
                      meta: 'accumulator',
                    },
                    {
                      value: '$min',
                      score: 1,
                      meta: 'accumulator',
                    },
                    {
                      value: '$map',
                      score: 1,
                      meta: 'expr:array',
                    },
                    {
                      value: '$meta',
                      score: 1,
                      meta: 'expr:text',
                    },
                    {
                      value: '$millisecond',
                      score: 1,
                      meta: 'expr:date',
                    },
                    {
                      value: '$minute',
                      score: 1,
                      meta: 'expr:date',
                    },
                    {
                      value: '$mod',
                      score: 1,
                      meta: 'expr:arith',
                    },
                    {
                      value: '$month',
                      score: 1,
                      meta: 'expr:date',
                    },
                    {
                      value: '$multiply',
                      score: 1,
                      meta: 'expr:arith',
                    },
                  ]);
                });
              });
            });

            context('when the stage is on multiple lines', function () {
              const { getCompletions } = setupStageCompleter('{\n  $m', {
                fields,
                serverVersion: '3.2.0',
                stageOperator: '$project',
              });

              it('returns matching expression operators + $project accumulators', function () {
                getCompletions((error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      value: '$max',
                      score: 1,
                      meta: 'accumulator',
                    },
                    {
                      value: '$min',
                      score: 1,
                      meta: 'accumulator',
                    },
                    {
                      value: '$map',
                      score: 1,
                      meta: 'expr:array',
                    },
                    {
                      value: '$meta',
                      score: 1,
                      meta: 'expr:text',
                    },
                    {
                      value: '$millisecond',
                      score: 1,
                      meta: 'expr:date',
                    },
                    {
                      value: '$minute',
                      score: 1,
                      meta: 'expr:date',
                    },
                    {
                      value: '$mod',
                      score: 1,
                      meta: 'expr:arith',
                    },
                    {
                      value: '$month',
                      score: 1,
                      meta: 'expr:date',
                    },
                    {
                      value: '$multiply',
                      score: 1,
                      meta: 'expr:arith',
                    },
                  ]);
                });
              });
            });
          });

          context('when the server version is 3.4.0', function () {
            context('when the accumulators are valid in $project', function () {
              const { getCompletions } = setupStageCompleter('{ $m', {
                fields,
                serverVersion: '3.4.0',
                stageOperator: '$project',
              });

              it('returns matching expression operators + $project accumulators', function () {
                getCompletions((error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      value: '$max',
                      score: 1,
                      meta: 'accumulator',
                    },
                    {
                      value: '$min',
                      score: 1,
                      meta: 'accumulator',
                    },
                    {
                      value: '$map',
                      score: 1,
                      meta: 'expr:array',
                    },
                    {
                      value: '$meta',
                      score: 1,
                      meta: 'expr:text',
                    },
                    {
                      value: '$millisecond',
                      score: 1,
                      meta: 'expr:date',
                    },
                    {
                      value: '$minute',
                      score: 1,
                      meta: 'expr:date',
                    },
                    {
                      value: '$mod',
                      score: 1,
                      meta: 'expr:arith',
                    },
                    {
                      value: '$month',
                      score: 1,
                      meta: 'expr:date',
                    },
                    {
                      value: '$multiply',
                      score: 1,
                      meta: 'expr:arith',
                    },
                  ]);
                });
              });
            });

            context(
              'when the accumulators are not valid in $project',
              function () {
                const { getCompletions } = setupStageCompleter('{ $p', {
                  fields,
                  serverVersion: '3.4.0',
                  stageOperator: '$project',
                });

                it('returns matching expression operators + $project accumulators', function () {
                  getCompletions((error, results) => {
                    expect(error).to.equal(null);
                    expect(results).to.deep.equal([
                      {
                        meta: 'accumulator',
                        score: 1,
                        value: '$push',
                      },
                      {
                        value: '$pow',
                        score: 1,
                        meta: 'expr:arith',
                      },
                    ]);
                  });
                });
              }
            );
          });

          context('when the server version is 3.0.0', function () {
            const { getCompletions } = setupStageCompleter('{ $e', {
              fields,
              serverVersion: '3.0.0',
              stageOperator: '$project',
            });

            it('returns matching expression operators only', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    value: '$eq',
                    score: 1,
                    meta: 'expr:comp',
                  },
                ]);
              });
            });
          });
        });

        context('when the stage operator is $group', function () {
          context('when the server version is 3.2.0', function () {
            const { getCompletions } = setupStageCompleter('{ $m', {
              fields,
              serverVersion: '3.2.0',
              stageOperator: '$group',
            });

            it('returns matching expression operators + accumulators', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    value: '$max',
                    score: 1,
                    meta: 'accumulator',
                  },
                  {
                    value: '$min',
                    score: 1,
                    meta: 'accumulator',
                  },
                  {
                    value: '$map',
                    score: 1,
                    meta: 'expr:array',
                  },
                  {
                    value: '$meta',
                    score: 1,
                    meta: 'expr:text',
                  },
                  {
                    value: '$millisecond',
                    score: 1,
                    meta: 'expr:date',
                  },
                  {
                    value: '$minute',
                    score: 1,
                    meta: 'expr:date',
                  },
                  {
                    value: '$mod',
                    score: 1,
                    meta: 'expr:arith',
                  },
                  {
                    value: '$month',
                    score: 1,
                    meta: 'expr:date',
                  },
                  {
                    value: '$multiply',
                    score: 1,
                    meta: 'expr:arith',
                  },
                ]);
              });
            });
          });

          context('when the server version is 3.4.0', function () {
            const { getCompletions } = setupStageCompleter('{ $p', {
              fields,
              serverVersion: '3.4.0',
              stageOperator: '$group',
            });

            it('returns matching expression operators + accumulators', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    value: '$push',
                    score: 1,
                    meta: 'accumulator',
                  },
                  {
                    value: '$pow',
                    score: 1,
                    meta: 'expr:arith',
                  },
                ]);
              });
            });
          });

          context('when the server version is 3.0.0', function () {
            const { getCompletions } = setupStageCompleter('{ $e', {
              fields,
              serverVersion: '3.0.0',
              stageOperator: '$group',
            });

            it('returns matching expression operators only', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    value: '$eq',
                    score: 1,
                    meta: 'expr:comp',
                  },
                ]);
              });
            });
          });
        });

        context('when the stage operator is not project or group', function () {
          context('when the version matches all', function () {
            const { getCompletions } = setupStageCompleter('{ $ar', {
              fields,
              serverVersion: '3.4.5',
              stageOperator: '$addToFields',
            });

            it('returns matching expression operators for the version', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    value: '$arrayElemAt',
                    score: 1,
                    meta: 'expr:array',
                  },
                  {
                    value: '$arrayToObject',
                    score: 1,
                    meta: 'expr:array',
                  },
                ]);
              });
            });
          });

          context('when the version matches a subset', function () {
            const { getCompletions } = setupStageCompleter('{ $ar', {
              fields,
              serverVersion: '3.4.0',
              stageOperator: '$addToFields',
            });

            it('returns matchin expression operators for the version', function () {
              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    value: '$arrayElemAt',
                    score: 1,
                    meta: 'expr:array',
                  },
                ]);
              });
            });
          });
        });
      });
    });

    context('when the current token is a comment', function () {
      context('when it is a single line comment', function () {
        context('when a comment is after an expression', function () {
          context('when an input symbol is after a comment', function () {
            it('no autocompletion', function () {
              const { getCompletions } = setupStageCompleter('{} //$', {
                fields,
                serverVersion: '3.4.0',
                stageOperator: '$match',
              });

              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results.length).to.equal(0);
              });
            });
          });

          context('when an input symbol is before a comment', function () {
            it('returns results', function () {
              const { getCompletions } = setupStageCompleter('{} $//', {
                fields,
                serverVersion: '3.4.0',
                stageOperator: '$match',
                pos: { row: 0, column: 4 },
              });

              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results.length).to.equal(31);
              });
            });
          });

          context('when an expression contains slashes', function () {
            context('when an input symbol is after a comment', function () {
              it('no autocompletion', function () {
                const { getCompletions } = setupStageCompleter(
                  "{x: '//'} //$",
                  { fields, serverVersion: '3.4.0', stageOperator: '$match' }
                );

                getCompletions((error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(0);
                });
              });
            });

            context('when an input symbol is before a comment', function () {
              it('returns results', function () {
                const { getCompletions } = setupStageCompleter(
                  "{x: '//'} $//",
                  {
                    fields,
                    serverVersion: '3.4.0',
                    stageOperator: '$match',
                    pos: { row: 0, column: 11 },
                  }
                );

                getCompletions((error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(31);
                });
              });
            });

            context(
              'when an input symbol is inside a single quote string',
              function () {
                it('returns results', function () {
                  const { getCompletions } = setupStageCompleter(
                    "{x: '//$'} //",
                    {
                      fields,
                      serverVersion: '3.4.0',
                      stageOperator: '$match',
                      pos: { row: 0, column: 7 },
                    }
                  );

                  getCompletions((error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(1);
                  });
                });
              }
            );

            context(
              'when an input symbol is inside a double quote string',
              function () {
                it('returns results', function () {
                  const { getCompletions } = setupStageCompleter(
                    '{x: "//$"} //',
                    {
                      fields,
                      serverVersion: '3.4.0',
                      stageOperator: '$match',
                      pos: { row: 0, column: 8 },
                    }
                  );

                  getCompletions((error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(1);
                  });
                });
              }
            );
          });

          context('when an expression contains a division', function () {
            context('when an input symbol is after a comment', function () {
              it('no autocompletion', function () {
                const { getCompletions } = setupStageCompleter("{x: '/'} //$", {
                  fields,
                  serverVersion: '3.4.0',
                  stageOperator: '$match',
                });

                getCompletions((error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(0);
                });
              });
            });

            context('when an input symbol is before a comment', function () {
              it('returns results', function () {
                const { getCompletions } = setupStageCompleter("{x: '/'} $//", {
                  fields,
                  serverVersion: '3.4.0',
                  stageOperator: '$match',
                  pos: { row: 0, column: 10 },
                });

                getCompletions((error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(31);
                });
              });
            });

            context(
              'when an input symbol is inside a single quote string',
              function () {
                it('returns results', function () {
                  const { getCompletions } = setupStageCompleter(
                    "{x: '/$'} //",
                    {
                      fields,
                      serverVersion: '3.4.0',
                      stageOperator: '$match',
                      pos: { row: 0, column: 6 },
                    }
                  );

                  getCompletions((error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(1);
                  });
                });
              }
            );

            context(
              'when an input symbol is inside a double quote string',
              function () {
                it('returns results', function () {
                  const { getCompletions } = setupStageCompleter(
                    '{x: "/$"} //',
                    {
                      fields,
                      serverVersion: '3.4.0',
                      stageOperator: '$match',
                      pos: { row: 0, column: 7 },
                    }
                  );

                  getCompletions((error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(1);
                  });
                });
              }
            );
          });

          context('when an expression contains regex', function () {
            context('when an input symbol is after a comment', function () {
              it('no autocompletion', function () {
                const { getCompletions } = setupStageCompleter(
                  '{x: /789$/} //$',
                  { fields, serverVersion: '3.4.0', stageOperator: '$match' }
                );

                getCompletions((error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(0);
                });
              });
            });

            context('when an input symbol is before a comment', function () {
              it('returns results', function () {
                const { getCompletions } = setupStageCompleter(
                  '{x: /789$/} $//',
                  {
                    fields,
                    serverVersion: '3.4.0',
                    stageOperator: '$match',
                    pos: { row: 0, column: 13 },
                  }
                );

                getCompletions((error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(31);
                });
              });
            });

            context(
              'when an input symbol is inside an expression after regex',
              function () {
                it('returns results', function () {
                  const { getCompletions } = setupStageCompleter(
                    '{x: /789$/$} $//',
                    {
                      fields,
                      serverVersion: '3.4.0',
                      stageOperator: '$match',
                      pos: { row: 0, column: 11 },
                    }
                  );

                  getCompletions((error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(31);
                  });
                });
              }
            );
          });
        });

        context('when a comment is on the beginning of a string', function () {
          context('when an input symbol is after a comment', function () {
            it('no autocompletion', function () {
              const { getCompletions } = setupStageCompleter('//$', {
                fields,
                serverVersion: '3.4.0',
                stageOperator: '$match',
              });

              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results.length).to.equal(0);
              });
            });
          });

          context('when an input symbol is before a comment', function () {
            it('returns results', function () {
              const { getCompletions } = setupStageCompleter('$//', {
                fields,
                serverVersion: '3.4.0',
                stageOperator: '$match',
                pos: { row: 0, column: 1 },
              });

              getCompletions((error, results) => {
                expect(error).to.equal(null);
                expect(results.length).to.equal(31);
              });
            });
          });

          context('when a string starts with a space', function () {
            context('when an input symbol is after a comment', function () {
              it('no autocompletion', function () {
                const { getCompletions } = setupStageCompleter(' //$', {
                  fields,
                  serverVersion: '3.4.0',
                  stageOperator: '$match',
                });

                getCompletions((error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(0);
                });
              });
            });

            context('when an input symbol is before a comment', function () {
              it('returns results', function () {
                const { getCompletions } = setupStageCompleter(' $//', {
                  fields,
                  serverVersion: '3.4.0',
                  stageOperator: '$match',
                  pos: { row: 0, column: 2 },
                });

                getCompletions((error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(31);
                });
              });
            });
          });
        });
      });

      context('when it is a comment block', function () {
        context('when it is a single comment block', function () {
          context('when a comment block is before expression', function () {
            context(
              'when a comment block is written as a single line',
              function () {
                context(
                  'when an input symbol is before a comment',
                  function () {
                    it('returns results', function () {
                      const { getCompletions } = setupStageCompleter(
                        '$/* query - The query in MQL. */ {}',
                        {
                          fields,
                          serverVersion: '3.4.0',
                          stageOperator: '$match',
                          pos: { row: 0, column: 1 },
                        }
                      );

                      getCompletions((error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(31);
                      });
                    });
                  }
                );

                context(
                  'when an input symbol is right after an /* openning tag',
                  function () {
                    it('no autocompletion', function () {
                      const { getCompletions } = setupStageCompleter(
                        '/*$ query - The query in MQL. */ {}',
                        {
                          fields,
                          serverVersion: '3.4.0',
                          stageOperator: '$match',
                        }
                      );

                      getCompletions((error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(0);
                      });
                    });
                  }
                );

                context(
                  'when an input symbol is right after an /** openning tag',
                  function () {
                    it('no autocompletion', function () {
                      const { getCompletions } = setupStageCompleter(
                        '/**$ * query - The query in MQL. */ {}',

                        {
                          fields,
                          serverVersion: '3.4.0',
                          stageOperator: '$match',
                        }
                      );

                      getCompletions((error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(0);
                      });
                    });
                  }
                );

                context(
                  'when an input symbol is inside a /* comment',
                  function () {
                    it('no autocompletion', function () {
                      const { getCompletions } = setupStageCompleter(
                        '/* query - The query$ in MQL. */ {}',
                        {
                          fields,
                          serverVersion: '3.4.0',
                          stageOperator: '$match',
                          pos: { row: 0, column: 21 },
                        }
                      );

                      getCompletions((error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(0);
                      });
                    });
                  }
                );

                context(
                  'when an input symbol is inside a /** comment',
                  function () {
                    it('no autocompletion', function () {
                      const { getCompletions } = setupStageCompleter(
                        '/** *$ query - The query in MQL. */ {}',
                        {
                          fields,
                          serverVersion: '3.4.0',
                          stageOperator: '$match',
                          pos: { row: 0, column: 6 },
                        }
                      );

                      getCompletions((error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(0);
                      });
                    });
                  }
                );

                context(
                  'when an input symbol is before a closing tag',
                  function () {
                    it('no autocompletion', function () {
                      const { getCompletions } = setupStageCompleter(
                        '/* query - The query in MQL. $*/ {}',

                        {
                          fields,
                          serverVersion: '3.4.0',
                          stageOperator: '$match',
                        }
                      );

                      getCompletions((error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(0);
                      });
                    });
                  }
                );

                context(
                  'when an input symbol is right after a comment',
                  function () {
                    it('returns results', function () {
                      const { getCompletions } = setupStageCompleter(
                        '/* query - The query in MQL. */$ {}',
                        {
                          fields,
                          serverVersion: '3.4.0',
                          stageOperator: '$match',
                          pos: { row: 0, column: 32 },
                        }
                      );

                      getCompletions((error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(31);
                      });
                    });
                  }
                );
              }
            );

            context('when a comment block is multiline', function () {
              context('when an input symbol is before a comment', function () {
                it('returns results', function () {
                  const { getCompletions } = setupStageCompleter(
                    '$/**\n * query - The query in MQL.\n */\n{\n \n}',
                    {
                      fields,
                      serverVersion: '3.4.0',
                      stageOperator: '$match',
                      pos: { row: 0, column: 1 },
                    }
                  );

                  getCompletions((error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(31);
                  });
                });
              });

              context(
                'when an input symbol is right after an /** openning tag',
                function () {
                  it('no autocompletion', function () {
                    const { getCompletions } = setupStageCompleter(
                      '/**$\n * query - The query in MQL.\n */\n{\n \n}',

                      {
                        fields,
                        serverVersion: '3.4.0',
                        stageOperator: '$match',
                      }
                    );

                    getCompletions((error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(0);
                    });
                  });
                }
              );

              context(
                'when an input symbol is right after a comment',
                function () {
                  it('returns results', function () {
                    const { getCompletions } = setupStageCompleter(
                      '/**\n * query - The query in MQL.\n */$\n{\n \n}',
                      {
                        fields,
                        serverVersion: '3.4.0',
                        stageOperator: '$match',
                        pos: { row: 2, column: 4 },
                      }
                    );

                    getCompletions((error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(31);
                    });
                  });
                }
              );

              context(
                'when an input symbol is after a comment in expression',
                function () {
                  it('returns results', function () {
                    const { getCompletions } = setupStageCompleter(
                      '/**\n * query - The query in MQL.\n */\n{\n $\n}',
                      {
                        fields,
                        serverVersion: '3.4.0',
                        stageOperator: '$match',
                        pos: { row: 4, column: 2 },
                      }
                    );

                    getCompletions((error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(31);
                    });
                  });
                }
              );
            });
          });

          context('when a comment block is after expression', function () {
            context('when a comment block is multiline', function () {
              context('when an input symbol is before a comment', function () {
                it('returns results', function () {
                  const { getCompletions } = setupStageCompleter(
                    '{\n \n}\n$/**\n * query - The query in MQL.\n */',
                    {
                      fields,
                      serverVersion: '3.4.0',
                      stageOperator: '$match',
                      pos: { row: 3, column: 1 },
                    }
                  );

                  getCompletions((error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(31);
                  });
                });
              });

              context(
                'when an input symbol is right after an /** openning tag',
                function () {
                  it('no autocompletion', function () {
                    const { getCompletions } = setupStageCompleter(
                      '{\n \n}\n/**$\n * query - The query in MQL.\n */',

                      {
                        fields,
                        serverVersion: '3.4.0',
                        stageOperator: '$match',
                      }
                    );

                    getCompletions((error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(0);
                    });
                  });
                }
              );

              context(
                'when an input symbol is right after a comment',
                function () {
                  it('returns results', function () {
                    const { getCompletions } = setupStageCompleter(
                      '{\n \n}\n/**\n * query - The query in MQL.\n */$',
                      {
                        fields,
                        serverVersion: '3.4.0',
                        stageOperator: '$match',
                        pos: { row: 5, column: 4 },
                      }
                    );

                    getCompletions((error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(31);
                    });
                  });
                }
              );
            });
          });
        });
      });
    });
  });
});
