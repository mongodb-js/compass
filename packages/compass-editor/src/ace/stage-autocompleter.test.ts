import type { Ace } from 'ace-builds';
import { EditSession } from 'ace-builds';
import sinon from 'sinon';
import { expect } from 'chai';
import { Mode } from 'ace-builds/src-noconflict/mode-javascript';
import { textCompleter } from 'ace-builds/src-noconflict/ext-language_tools';
import {
  CONVERSION_OPERATORS,
  EXPRESSION_OPERATORS,
} from '@mongodb-js/mongodb-constants';
import { StageAutoCompleter } from './stage-autocompleter';
import type { MongoDBCompletion } from '../types';

const ALL_OPS = ([] as MongoDBCompletion[]).concat(
  EXPRESSION_OPERATORS,
  CONVERSION_OPERATORS
);

describe('StageAutoCompleter', function () {
  const fields = [
    { name: 'name', value: 'name', score: 1, meta: 'field', version: '0.0.0' },
  ];
  const mockEditor = sinon.spy() as unknown as Ace.Editor;
  const mockCompleter = sinon.spy() as unknown as Ace.Completer;

  describe('#getCompletions', function () {
    context('when the current token is a string', function () {
      context('when there are no previous autocompletions', function () {
        const completer = new StageAutoCompleter(
          '3.4.0',
          textCompleter,
          fields,
          null
        );
        const session = new EditSession('', new Mode());
        const position = { row: 0, column: 0 };

        it('returns no results', function () {
          completer.getCompletions(
            mockEditor,
            session,
            position,
            '',
            (error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([]);
            }
          );
        });
      });

      context('when there are previous autocompletions', function () {
        context('when the latest token is a string', function () {
          const completer = new StageAutoCompleter(
            '3.4.0',
            textCompleter,
            fields,
            null
          );
          const session = new EditSession('{ $project: { "$', new Mode());
          const position = { row: 0, column: 15 };

          it('returns the field names', function () {
            completer.getCompletions(
              mockEditor,
              session,
              position,
              '$',
              (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    meta: 'field',
                    name: '$name',
                    score: 1,
                    value: '$name',
                    version: '0.0.0',
                  },
                ]);
              }
            );
          });
        });
      });

      context('when the previous token is an accumulator', function () {
        const completer = new StageAutoCompleter(
          '3.6.0',
          textCompleter,
          fields,
          null
        );
        const session = new EditSession(
          '{ _id: null, avgDur: { $avg: "$"}}',
          new Mode()
        );
        const position = { row: 0, column: 31 };

        it('returns the field names', function () {
          completer.getCompletions(
            mockEditor,
            session,
            position,
            '$',
            (error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  meta: 'field',
                  name: '$name',
                  score: 1,
                  value: '$name',
                  version: '0.0.0',
                },
              ]);
            }
          );
        });
      });

      context('when the field names have special characters', function () {
        const oddFields = [
          {
            name: '"name.test"',
            value: '"name.test"',
            score: 1,
            meta: 'field',
            version: '0.0.0',
          },
          {
            name: '"name space"',
            value: '"name space"',
            score: 1,
            meta: 'field',
            version: '0.0.0',
          },
        ];
        const completer = new StageAutoCompleter(
          '3.6.0',
          textCompleter,
          oddFields,
          null
        );
        const session = new EditSession(
          '{ _id: null, avgDur: { $avg: "$"}}',
          new Mode()
        );
        const position = { row: 0, column: 31 };

        it('returns the field names without the quotes', function () {
          completer.getCompletions(
            mockEditor,
            session,
            position,
            '$',
            (error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  meta: 'field',
                  name: '$name.test',
                  score: 1,
                  value: '$name.test',
                  version: '0.0.0',
                },
                {
                  meta: 'field',
                  name: '$name space',
                  score: 1,
                  value: '$name space',
                  version: '0.0.0',
                },
              ]);
            }
          );
        });
      });

      context('when there are tokens after', function () {
        context('when the latest token is a string', function () {
          const completer = new StageAutoCompleter(
            '3.4.0',
            textCompleter,
            fields,
            null
          );
          const session = new EditSession(
            '{ $match: { $and: [ "$var1", "$var2" ]}}',
            new Mode()
          );
          const position = { row: 0, column: 32 };

          it('returns only the previous results', function () {
            completer.getCompletions(
              mockEditor,
              session,
              position,
              '$va',
              (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    caption: '$match',
                    meta: 'local',
                    score: 3,
                    value: '$match',
                  },
                  {
                    caption: '$and',
                    meta: 'local',
                    score: 4,
                    value: '$and',
                  },
                  {
                    caption: '$var1',
                    meta: 'local',
                    score: 5,
                    value: '$var1',
                  },
                ]);
              }
            );
          });
        });
      });
    });

    context('when the current token is an identifier', function () {
      context('when no stage operator has been defined', function () {
        context('when the version is not provided', function () {
          context('when the prefix is empty', function () {
            const completer = new StageAutoCompleter(
              '3.4.0',
              textCompleter,
              fields,
              null
            );
            const session = new EditSession('', new Mode());
            const position = { row: 0, column: 0 };

            it('returns no results', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([]);
                }
              );
            });
          });

          context('when the prefix begins with a letter', function () {
            context('when the token is on the same line', function () {
              context('when the token matches a field', function () {
                const completer = new StageAutoCompleter(
                  '3.6.0',
                  textCompleter,
                  fields,
                  null
                );
                const session = new EditSession('{ n', new Mode());
                const position = { row: 0, column: 2 };

                it('returns all the matching field names', function () {
                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    'n',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results).to.deep.equal([
                        {
                          name: 'name',
                          value: 'name',
                          score: 1,
                          meta: 'field',
                          version: '0.0.0',
                        },
                      ]);
                    }
                  );
                });
              });
              context('when the token matches a BSON type', function () {
                const completer = new StageAutoCompleter(
                  '3.6.0',
                  textCompleter,
                  fields,
                  null
                );
                const session = new EditSession('{ N', new Mode());
                const position = { row: 0, column: 2 };

                it('returns all the matching field names', function () {
                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    'N',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results.map((r) => r.value)).to.deep.equal([
                        'NumberInt',
                        'NumberLong',
                        'NumberDecimal',
                      ]);
                    }
                  );
                });
              });
            });
          });

          context('when the prefix begins with $', function () {
            context('when the latest version of server', function () {
              const latestServer = '5.2.0';

              context('when the token is on the same line', function () {
                const completer = new StageAutoCompleter(
                  latestServer,
                  textCompleter,
                  fields,
                  null
                );
                const session = new EditSession('{ $', new Mode());
                const position = { row: 0, column: 2 };

                it('returns all the expression operators', function () {
                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    '$',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results).to.deep.equal(ALL_OPS);
                    }
                  );
                });
              });

              context('when the token is on another line', function () {
                const completer = new StageAutoCompleter(
                  latestServer,
                  textCompleter,
                  fields,
                  null
                );
                const session = new EditSession('{\n  $', new Mode());
                const position = { row: 1, column: 3 };

                it('returns all the expression operators', function () {
                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    '$',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results).to.deep.equal(ALL_OPS);
                    }
                  );
                });
              });

              context('when prerelease version', function () {
                const completer = new StageAutoCompleter(
                  `${latestServer}-rc0`,
                  textCompleter,
                  fields,
                  null
                );
                const session = new EditSession('{\n  $', new Mode());
                const position = { row: 1, column: 3 };

                it('returns all the expression operators', function () {
                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    '$',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results).to.deep.equal(ALL_OPS);
                    }
                  );
                });
              });
            });
          });

          context('when the prefix begins with an unknown', function () {
            const completer = new StageAutoCompleter(
              '3.4.0',
              textCompleter,
              fields,
              null
            );
            const session = new EditSession('{ $notAnOp', new Mode());
            const position = { row: 0, column: 9 };

            it('returns none of the expression operators', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$notAnOp',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([]);
                }
              );
            });
          });

          context('when the server version is a RC', function () {
            const completer = new StageAutoCompleter(
              '4.0.0-rc6',
              textCompleter,
              fields,
              null
            );
            const session = new EditSession('{ $conv', new Mode());
            const position = { row: 0, column: 6 };

            it('returns the matching conversion operator', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$conv',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      meta: 'conv',
                      name: '$convert',
                      score: 1,
                      value: '$convert',
                      version: '3.7.2',
                    },
                  ]);
                }
              );
            });
          });

          context('when the prefix begins with $a', function () {
            const completer = new StageAutoCompleter(
              '3.4.0',
              textCompleter,
              fields,
              null
            );
            const session = new EditSession('{ $a', new Mode());
            const position = { row: 0, column: 3 };

            it('returns all the expression operators starting with $a', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$a',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$abs',
                      value: '$abs',
                      score: 1,
                      meta: 'expr:arith',
                      version: '3.2.0',
                    },
                    {
                      name: '$add',
                      value: '$add',
                      score: 1,
                      meta: 'expr:arith',
                      version: '2.2.0',
                    },
                    {
                      name: '$allElementsTrue',
                      value: '$allElementsTrue',
                      score: 1,
                      meta: 'expr:set',
                      version: '2.6.0',
                    },
                    {
                      name: '$and',
                      value: '$and',
                      score: 1,
                      meta: 'expr:bool',
                      version: '2.2.0',
                    },
                    {
                      name: '$anyElementTrue',
                      value: '$anyElementTrue',
                      score: 1,
                      meta: 'expr:set',
                      version: '2.6.0',
                    },
                    {
                      name: '$arrayElemAt',
                      value: '$arrayElemAt',
                      score: 1,
                      meta: 'expr:array',
                      version: '3.2.0',
                    },
                  ]);
                }
              );
            });
          });

          context('when the prefix begins with $co', function () {
            const completer = new StageAutoCompleter(
              '3.4.0',
              textCompleter,
              fields,
              null
            );
            const session = new EditSession('{ $co', new Mode());
            const position = { row: 0, column: 4 };

            it('returns all the expression operators starting with $co', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$co',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$concat',
                      value: '$concat',
                      score: 1,
                      meta: 'expr:string',
                      version: '2.4.0',
                    },
                    {
                      name: '$concatArrays',
                      value: '$concatArrays',
                      score: 1,
                      meta: 'expr:array',
                      version: '3.2.0',
                    },
                    {
                      name: '$cond',
                      value: '$cond',
                      score: 1,
                      meta: 'expr:cond',
                      version: '2.6.0',
                    },
                  ]);
                }
              );
            });
          });

          context('when the prefix begins with $sec', function () {
            const completer = new StageAutoCompleter(
              '3.4.0',
              textCompleter,
              fields,
              null
            );
            const session = new EditSession('{ $sec', new Mode());
            const position = { row: 0, column: 4 };

            it('returns all the expression operators starting with $sec', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$sec',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$second',
                      value: '$second',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.2.0',
                    },
                  ]);
                }
              );
            });
          });
        });

        context('when the version is provided', function () {
          const completer = new StageAutoCompleter(
            '3.0.0',
            mockCompleter,
            fields,
            null
          );
          const session = new EditSession('{ $si', new Mode());
          const position = { row: 0, column: 4 };

          it('returns available operators for the version', function () {
            completer.getCompletions(
              mockEditor,
              session,
              position,
              '$si',
              (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$size',
                    value: '$size',
                    score: 1,
                    meta: 'expr:array',
                    version: '2.6.0',
                  },
                ]);
              }
            );
          });
        });
      });

      context('when a stage operator has been defined', function () {
        context('when the stage operator is $project', function () {
          context('when the server version is 3.2.0', function () {
            context('when the stage is a single line', function () {
              const completer = new StageAutoCompleter(
                '3.2.0',
                mockCompleter,
                fields,
                '$project'
              );
              const session = new EditSession('{ $m', new Mode());
              const position = { row: 0, column: 3 };

              it('returns matching expression operators + $project accumulators', function () {
                completer.getCompletions(
                  mockEditor,
                  session,
                  position,
                  '$m',
                  (error, results) => {
                    expect(error).to.equal(null);
                    expect(results).to.deep.equal([
                      {
                        name: '$map',
                        value: '$map',
                        score: 1,
                        meta: 'expr:array',
                        version: '2.6.0',
                      },
                      {
                        name: '$meta',
                        value: '$meta',
                        score: 1,
                        meta: 'expr:text',
                        version: '2.6.0',
                      },
                      {
                        name: '$millisecond',
                        value: '$millisecond',
                        score: 1,
                        meta: 'expr:date',
                        version: '2.4.0',
                      },
                      {
                        name: '$minute',
                        value: '$minute',
                        score: 1,
                        meta: 'expr:date',
                        version: '2.2.0',
                      },
                      {
                        name: '$mod',
                        value: '$mod',
                        score: 1,
                        meta: 'expr:arith',
                        version: '2.2.0',
                      },
                      {
                        name: '$month',
                        value: '$month',
                        score: 1,
                        meta: 'expr:date',
                        version: '2.2.0',
                      },
                      {
                        name: '$multiply',
                        value: '$multiply',
                        score: 1,
                        meta: 'expr:arith',
                        version: '2.2.0',
                      },
                      {
                        name: '$max',
                        value: '$max',
                        score: 1,
                        meta: 'accumulator',
                        version: '2.2.0',
                        projectVersion: '3.2.0',
                      },
                      {
                        name: '$min',
                        value: '$min',
                        score: 1,
                        meta: 'accumulator',
                        version: '2.2.0',
                        projectVersion: '3.2.0',
                      },
                    ]);
                  }
                );
              });
            });

            context('when the stage is on multiple lines', function () {
              const completer = new StageAutoCompleter(
                '3.2.0',
                mockCompleter,
                fields,
                '$project'
              );
              const session = new EditSession('{\n  $m', new Mode());
              const position = { row: 1, column: 4 };

              it('returns matching expression operators + $project accumulators', function () {
                completer.getCompletions(
                  mockEditor,
                  session,
                  position,
                  '$m',
                  (error, results) => {
                    expect(error).to.equal(null);
                    expect(results).to.deep.equal([
                      {
                        name: '$map',
                        value: '$map',
                        score: 1,
                        meta: 'expr:array',
                        version: '2.6.0',
                      },
                      {
                        name: '$meta',
                        value: '$meta',
                        score: 1,
                        meta: 'expr:text',
                        version: '2.6.0',
                      },
                      {
                        name: '$millisecond',
                        value: '$millisecond',
                        score: 1,
                        meta: 'expr:date',
                        version: '2.4.0',
                      },
                      {
                        name: '$minute',
                        value: '$minute',
                        score: 1,
                        meta: 'expr:date',
                        version: '2.2.0',
                      },
                      {
                        name: '$mod',
                        value: '$mod',
                        score: 1,
                        meta: 'expr:arith',
                        version: '2.2.0',
                      },
                      {
                        name: '$month',
                        value: '$month',
                        score: 1,
                        meta: 'expr:date',
                        version: '2.2.0',
                      },
                      {
                        name: '$multiply',
                        value: '$multiply',
                        score: 1,
                        meta: 'expr:arith',
                        version: '2.2.0',
                      },
                      {
                        name: '$max',
                        value: '$max',
                        score: 1,
                        meta: 'accumulator',
                        version: '2.2.0',
                        projectVersion: '3.2.0',
                      },
                      {
                        name: '$min',
                        value: '$min',
                        score: 1,
                        meta: 'accumulator',
                        version: '2.2.0',
                        projectVersion: '3.2.0',
                      },
                    ]);
                  }
                );
              });
            });
          });

          context('when the server version is 3.4.0', function () {
            context('when the accumulators are valid in $project', function () {
              const completer = new StageAutoCompleter(
                '3.4.0',
                mockCompleter,
                fields,
                '$project'
              );
              const session = new EditSession('{ $m', new Mode());
              const position = { row: 0, column: 3 };

              it('returns matching expression operators + $project accumulators', function () {
                completer.getCompletions(
                  mockEditor,
                  session,
                  position,
                  '$m',
                  (error, results) => {
                    expect(error).to.equal(null);
                    expect(results).to.deep.equal([
                      {
                        name: '$map',
                        value: '$map',
                        score: 1,
                        meta: 'expr:array',
                        version: '2.6.0',
                      },
                      {
                        name: '$meta',
                        value: '$meta',
                        score: 1,
                        meta: 'expr:text',
                        version: '2.6.0',
                      },
                      {
                        name: '$millisecond',
                        value: '$millisecond',
                        score: 1,
                        meta: 'expr:date',
                        version: '2.4.0',
                      },
                      {
                        name: '$minute',
                        value: '$minute',
                        score: 1,
                        meta: 'expr:date',
                        version: '2.2.0',
                      },
                      {
                        name: '$mod',
                        value: '$mod',
                        score: 1,
                        meta: 'expr:arith',
                        version: '2.2.0',
                      },
                      {
                        name: '$month',
                        value: '$month',
                        score: 1,
                        meta: 'expr:date',
                        version: '2.2.0',
                      },
                      {
                        name: '$multiply',
                        value: '$multiply',
                        score: 1,
                        meta: 'expr:arith',
                        version: '2.2.0',
                      },
                      {
                        name: '$max',
                        value: '$max',
                        score: 1,
                        meta: 'accumulator',
                        version: '2.2.0',
                        projectVersion: '3.2.0',
                      },
                      {
                        name: '$min',
                        value: '$min',
                        score: 1,
                        meta: 'accumulator',
                        version: '2.2.0',
                        projectVersion: '3.2.0',
                      },
                    ]);
                  }
                );
              });
            });

            context(
              'when the accumulators are not valid in $project',
              function () {
                const completer = new StageAutoCompleter(
                  '3.4.0',
                  mockCompleter,
                  fields,
                  '$project'
                );
                const session = new EditSession('{ $p', new Mode());
                const position = { row: 0, column: 3 };

                it('returns matching expression operators + $project accumulators', function () {
                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    '$p',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results).to.deep.equal([
                        {
                          name: '$pow',
                          value: '$pow',
                          score: 1,
                          meta: 'expr:arith',
                          version: '3.2.0',
                        },
                      ]);
                    }
                  );
                });
              }
            );
          });

          context('when the server version is 3.0.0', function () {
            const completer = new StageAutoCompleter(
              '3.0.0',
              mockCompleter,
              fields,
              '$project'
            );
            const session = new EditSession('{ $e', new Mode());
            const position = { row: 0, column: 3 };

            it('returns matching expression operators only', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$e',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$eq',
                      value: '$eq',
                      score: 1,
                      meta: 'expr:comp',
                      version: '2.2.0',
                    },
                  ]);
                }
              );
            });
          });
        });

        context('when the stage operator is $group', function () {
          context('when the server version is 3.2.0', function () {
            const completer = new StageAutoCompleter(
              '3.2.0',
              mockCompleter,
              fields,
              '$group'
            );
            const session = new EditSession('{ $m', new Mode());
            const position = { row: 0, column: 3 };

            it('returns matching expression operators + accumulators', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$m',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$map',
                      value: '$map',
                      score: 1,
                      meta: 'expr:array',
                      version: '2.6.0',
                    },
                    {
                      name: '$meta',
                      value: '$meta',
                      score: 1,
                      meta: 'expr:text',
                      version: '2.6.0',
                    },
                    {
                      name: '$millisecond',
                      value: '$millisecond',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.4.0',
                    },
                    {
                      name: '$minute',
                      value: '$minute',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.2.0',
                    },
                    {
                      name: '$mod',
                      value: '$mod',
                      score: 1,
                      meta: 'expr:arith',
                      version: '2.2.0',
                    },
                    {
                      name: '$month',
                      value: '$month',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.2.0',
                    },
                    {
                      name: '$multiply',
                      value: '$multiply',
                      score: 1,
                      meta: 'expr:arith',
                      version: '2.2.0',
                    },
                    {
                      name: '$max',
                      value: '$max',
                      score: 1,
                      meta: 'accumulator',
                      version: '2.2.0',
                      projectVersion: '3.2.0',
                    },
                    {
                      name: '$min',
                      value: '$min',
                      score: 1,
                      meta: 'accumulator',
                      version: '2.2.0',
                      projectVersion: '3.2.0',
                    },
                  ]);
                }
              );
            });
          });

          context('when the server version is 3.4.0', function () {
            const completer = new StageAutoCompleter(
              '3.4.0',
              mockCompleter,
              fields,
              '$group'
            );
            const session = new EditSession('{ $p', new Mode());
            const position = { row: 0, column: 3 };

            it('returns matching expression operators + accumulators', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$p',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$pow',
                      value: '$pow',
                      score: 1,
                      meta: 'expr:arith',
                      version: '3.2.0',
                    },
                    {
                      name: '$push',
                      value: '$push',
                      score: 1,
                      meta: 'accumulator',
                      version: '2.2.0',
                    },
                  ]);
                }
              );
            });
          });

          context('when the server version is 3.0.0', function () {
            const completer = new StageAutoCompleter(
              '3.0.0',
              mockCompleter,
              fields,
              '$group'
            );
            const session = new EditSession('{ $e', new Mode());
            const position = { row: 0, column: 3 };

            it('returns matching expression operators only', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$e',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$eq',
                      value: '$eq',
                      score: 1,
                      meta: 'expr:comp',
                      version: '2.2.0',
                    },
                  ]);
                }
              );
            });
          });
        });

        context('when the stage operator is not project or group', function () {
          context('when the version matches all', function () {
            const completer = new StageAutoCompleter(
              '3.4.5',
              mockCompleter,
              fields,
              '$addToFields'
            );
            const session = new EditSession('{ $ar', new Mode());
            const position = { row: 0, column: 4 };

            it('returns matching expression operators for the version', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$ar',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$arrayElemAt',
                      value: '$arrayElemAt',
                      score: 1,
                      meta: 'expr:array',
                      version: '3.2.0',
                    },
                    {
                      name: '$arrayToObject',
                      value: '$arrayToObject',
                      score: 1,
                      meta: 'expr:array',
                      version: '3.4.4',
                    },
                  ]);
                }
              );
            });
          });

          context('when the version matches a subset', function () {
            const completer = new StageAutoCompleter(
              '3.4.0',
              mockCompleter,
              fields,
              '$addToFields'
            );
            const session = new EditSession('{ $ar', new Mode());
            const position = { row: 0, column: 4 };

            it('returns matchin expression operators for the version', function () {
              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$ar',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$arrayElemAt',
                      value: '$arrayElemAt',
                      score: 1,
                      meta: 'expr:array',
                      version: '3.2.0',
                    },
                  ]);
                }
              );
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
              const completer = new StageAutoCompleter(
                '3.4.0',
                textCompleter,
                fields,
                '$match'
              );
              const session = new EditSession('{} //$', new Mode());
              const position = { row: 0, column: 6 };

              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(0);
                }
              );
            });
          });

          context('when an input symbol is before a comment', function () {
            it('returns results', function () {
              const completer = new StageAutoCompleter(
                '3.4.0',
                textCompleter,
                fields,
                '$match'
              );
              const session = new EditSession('{} $//', new Mode());
              const position = { row: 0, column: 4 };

              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(31);
                }
              );
            });
          });

          context('when an expression contains slashes', function () {
            context('when an input symbol is after a comment', function () {
              it('no autocompletion', function () {
                const completer = new StageAutoCompleter(
                  '3.4.0',
                  textCompleter,
                  fields,
                  '$match'
                );
                const session = new EditSession("{x: '//'} //$", new Mode());
                const position = { row: 0, column: 13 };

                completer.getCompletions(
                  mockEditor,
                  session,
                  position,
                  '$',
                  (error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(0);
                  }
                );
              });
            });

            context('when an input symbol is before a comment', function () {
              it('returns results', function () {
                const completer = new StageAutoCompleter(
                  '3.4.0',
                  textCompleter,
                  fields,
                  '$match'
                );
                const session = new EditSession("{x: '//'} $//", new Mode());
                const position = { row: 0, column: 11 };

                completer.getCompletions(
                  mockEditor,
                  session,
                  position,
                  '$',
                  (error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(31);
                  }
                );
              });
            });

            context(
              'when an input symbol is inside a single quote string',
              function () {
                it('returns results', function () {
                  const completer = new StageAutoCompleter(
                    '3.4.0',
                    textCompleter,
                    fields,
                    '$match'
                  );
                  const session = new EditSession("{x: '//$'} //", new Mode());
                  const position = { row: 0, column: 7 };

                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    '$',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(1);
                    }
                  );
                });
              }
            );

            context(
              'when an input symbol is inside a double quote string',
              function () {
                it('returns results', function () {
                  const completer = new StageAutoCompleter(
                    '3.4.0',
                    textCompleter,
                    fields,
                    '$match'
                  );
                  const session = new EditSession('{x: "//$"} //', new Mode());
                  const position = { row: 0, column: 8 };

                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    '$',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(1);
                    }
                  );
                });
              }
            );
          });

          context('when an expression contains a division', function () {
            context('when an input symbol is after a comment', function () {
              it('no autocompletion', function () {
                const completer = new StageAutoCompleter(
                  '3.4.0',
                  textCompleter,
                  fields,
                  '$match'
                );
                const session = new EditSession("{x: '/'} //$", new Mode());
                const position = { row: 0, column: 12 };

                completer.getCompletions(
                  mockEditor,
                  session,
                  position,
                  '$',
                  (error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(0);
                  }
                );
              });
            });

            context('when an input symbol is before a comment', function () {
              it('returns results', function () {
                const completer = new StageAutoCompleter(
                  '3.4.0',
                  textCompleter,
                  fields,
                  '$match'
                );
                const session = new EditSession("{x: '/'} $//", new Mode());
                const position = { row: 0, column: 10 };

                completer.getCompletions(
                  mockEditor,
                  session,
                  position,
                  '$',
                  (error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(31);
                  }
                );
              });
            });

            context(
              'when an input symbol is inside a single quote string',
              function () {
                it('returns results', function () {
                  const completer = new StageAutoCompleter(
                    '3.4.0',
                    textCompleter,
                    fields,
                    '$match'
                  );
                  const session = new EditSession("{x: '/$'} //", new Mode());
                  const position = { row: 0, column: 6 };

                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    '$',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(1);
                    }
                  );
                });
              }
            );

            context(
              'when an input symbol is inside a double quote string',
              function () {
                it('returns results', function () {
                  const completer = new StageAutoCompleter(
                    '3.4.0',
                    textCompleter,
                    fields,
                    '$match'
                  );
                  const session = new EditSession('{x: "/$"} //', new Mode());
                  const position = { row: 0, column: 7 };

                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    '$',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(1);
                    }
                  );
                });
              }
            );
          });

          context('when an expression contains regex', function () {
            context('when an input symbol is after a comment', function () {
              it('no autocompletion', function () {
                const completer = new StageAutoCompleter(
                  '3.4.0',
                  textCompleter,
                  fields,
                  '$match'
                );
                const session = new EditSession('{x: /789$/} //$', new Mode());
                const position = { row: 0, column: 15 };

                completer.getCompletions(
                  mockEditor,
                  session,
                  position,
                  '$',
                  (error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(0);
                  }
                );
              });
            });

            context('when an input symbol is before a comment', function () {
              it('returns results', function () {
                const completer = new StageAutoCompleter(
                  '3.4.0',
                  textCompleter,
                  fields,
                  '$match'
                );
                const session = new EditSession('{x: /789$/} $//', new Mode());
                const position = { row: 0, column: 13 };

                completer.getCompletions(
                  mockEditor,
                  session,
                  position,
                  '$',
                  (error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(31);
                  }
                );
              });
            });

            context(
              'when an input symbol is inside an expression after regex',
              function () {
                it('returns results', function () {
                  const completer = new StageAutoCompleter(
                    '3.4.0',
                    textCompleter,
                    fields,
                    '$match'
                  );
                  const session = new EditSession(
                    '{x: /789$/$} $//',
                    new Mode()
                  );
                  const position = { row: 0, column: 11 };

                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    '$',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(31);
                    }
                  );
                });
              }
            );
          });
        });

        context('when a comment is on the beginning of a string', function () {
          context('when an input symbol is after a comment', function () {
            it('no autocompletion', function () {
              const completer = new StageAutoCompleter(
                '3.4.0',
                textCompleter,
                fields,
                '$match'
              );
              const session = new EditSession('//$', new Mode());
              const position = { row: 0, column: 3 };

              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(0);
                }
              );
            });
          });

          context('when an input symbol is before a comment', function () {
            it('returns results', function () {
              const completer = new StageAutoCompleter(
                '3.4.0',
                textCompleter,
                fields,
                '$match'
              );
              const session = new EditSession('$//', new Mode());
              const position = { row: 0, column: 1 };

              completer.getCompletions(
                mockEditor,
                session,
                position,
                '$',
                (error, results) => {
                  expect(error).to.equal(null);
                  expect(results.length).to.equal(31);
                }
              );
            });
          });

          context('when a string starts with a space', function () {
            context('when an input symbol is after a comment', function () {
              it('no autocompletion', function () {
                const completer = new StageAutoCompleter(
                  '3.4.0',
                  textCompleter,
                  fields,
                  '$match'
                );
                const session = new EditSession(' //$', new Mode());
                const position = { row: 0, column: 4 };

                completer.getCompletions(
                  mockEditor,
                  session,
                  position,
                  '$',
                  (error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(0);
                  }
                );
              });
            });

            context('when an input symbol is before a comment', function () {
              it('returns results', function () {
                const completer = new StageAutoCompleter(
                  '3.4.0',
                  textCompleter,
                  fields,
                  '$match'
                );
                const session = new EditSession(' $//', new Mode());
                const position = { row: 0, column: 2 };

                completer.getCompletions(
                  mockEditor,
                  session,
                  position,
                  '$',
                  (error, results) => {
                    expect(error).to.equal(null);
                    expect(results.length).to.equal(31);
                  }
                );
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
                      const completer = new StageAutoCompleter(
                        '3.4.0',
                        textCompleter,
                        fields,
                        '$match'
                      );
                      const session = new EditSession(
                        '$/* query - The query in MQL. */ {}',
                        new Mode()
                      );
                      const position = { row: 0, column: 1 };

                      completer.getCompletions(
                        mockEditor,
                        session,
                        position,
                        '$',
                        (error, results) => {
                          expect(error).to.equal(null);
                          expect(results.length).to.equal(31);
                        }
                      );
                    });
                  }
                );

                context(
                  'when an input symbol is right after an /* openning tag',
                  function () {
                    it('no autocompletion', function () {
                      const completer = new StageAutoCompleter(
                        '3.4.0',
                        textCompleter,
                        fields,
                        '$match'
                      );
                      const session = new EditSession(
                        '/*$ query - The query in MQL. */ {}',
                        new Mode()
                      );
                      const position = { row: 0, column: 3 };

                      completer.getCompletions(
                        mockEditor,
                        session,
                        position,
                        '$',
                        (error, results) => {
                          expect(error).to.equal(null);
                          expect(results.length).to.equal(0);
                        }
                      );
                    });
                  }
                );

                context(
                  'when an input symbol is right after an /** openning tag',
                  function () {
                    it('no autocompletion', function () {
                      const completer = new StageAutoCompleter(
                        '3.4.0',
                        textCompleter,
                        fields,
                        '$match'
                      );
                      const session = new EditSession(
                        '/**$ * query - The query in MQL. */ {}',
                        new Mode()
                      );
                      const position = { row: 0, column: 4 };

                      completer.getCompletions(
                        mockEditor,
                        session,
                        position,
                        '$',
                        (error, results) => {
                          expect(error).to.equal(null);
                          expect(results.length).to.equal(0);
                        }
                      );
                    });
                  }
                );

                context(
                  'when an input symbol is inside a /* comment',
                  function () {
                    it('no autocompletion', function () {
                      const completer = new StageAutoCompleter(
                        '3.4.0',
                        textCompleter,
                        fields,
                        '$match'
                      );
                      const session = new EditSession(
                        '/* query - The query$ in MQL. */ {}',
                        new Mode()
                      );
                      const position = { row: 0, column: 21 };

                      completer.getCompletions(
                        mockEditor,
                        session,
                        position,
                        '$',
                        (error, results) => {
                          expect(error).to.equal(null);
                          expect(results.length).to.equal(0);
                        }
                      );
                    });
                  }
                );

                context(
                  'when an input symbol is inside a /** comment',
                  function () {
                    it('no autocompletion', function () {
                      const completer = new StageAutoCompleter(
                        '3.4.0',
                        textCompleter,
                        fields,
                        '$match'
                      );
                      const session = new EditSession(
                        '/** *$ query - The query in MQL. */ {}',
                        new Mode()
                      );
                      const position = { row: 0, column: 6 };

                      completer.getCompletions(
                        mockEditor,
                        session,
                        position,
                        '$',
                        (error, results) => {
                          expect(error).to.equal(null);
                          expect(results.length).to.equal(0);
                        }
                      );
                    });
                  }
                );

                context(
                  'when an input symbol is before a closing tag',
                  function () {
                    it('no autocompletion', function () {
                      const completer = new StageAutoCompleter(
                        '3.4.0',
                        textCompleter,
                        fields,
                        '$match'
                      );
                      const session = new EditSession(
                        '/* query - The query in MQL. $*/ {}',
                        new Mode()
                      );
                      const position = { row: 0, column: 30 };

                      completer.getCompletions(
                        mockEditor,
                        session,
                        position,
                        '$',
                        (error, results) => {
                          expect(error).to.equal(null);
                          expect(results.length).to.equal(0);
                        }
                      );
                    });
                  }
                );

                context(
                  'when an input symbol is right after a comment',
                  function () {
                    it('returns results', function () {
                      const completer = new StageAutoCompleter(
                        '3.4.0',
                        textCompleter,
                        fields,
                        '$match'
                      );
                      const session = new EditSession(
                        '/* query - The query in MQL. */$ {}',
                        new Mode()
                      );
                      const position = { row: 0, column: 32 };

                      completer.getCompletions(
                        mockEditor,
                        session,
                        position,
                        '$',
                        (error, results) => {
                          expect(error).to.equal(null);
                          expect(results.length).to.equal(31);
                        }
                      );
                    });
                  }
                );
              }
            );

            context('when a comment block is multiline', function () {
              context('when an input symbol is before a comment', function () {
                it('returns results', function () {
                  const completer = new StageAutoCompleter(
                    '3.4.0',
                    textCompleter,
                    fields,
                    '$match'
                  );
                  const session = new EditSession(
                    '$/**\n * query - The query in MQL.\n */\n{\n \n}',
                    new Mode()
                  );
                  const position = { row: 0, column: 1 };

                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    '$',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(31);
                    }
                  );
                });
              });

              context(
                'when an input symbol is right after an /** openning tag',
                function () {
                  it('no autocompletion', function () {
                    const completer = new StageAutoCompleter(
                      '3.4.0',
                      textCompleter,
                      fields,
                      '$match'
                    );
                    const session = new EditSession(
                      '/**$\n * query - The query in MQL.\n */\n{\n \n}',
                      new Mode()
                    );
                    const position = { row: 0, column: 4 };

                    completer.getCompletions(
                      mockEditor,
                      session,
                      position,
                      '$',
                      (error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(0);
                      }
                    );
                  });
                }
              );

              context(
                'when an input symbol is right after a comment',
                function () {
                  it('returns results', function () {
                    const completer = new StageAutoCompleter(
                      '3.4.0',
                      textCompleter,
                      fields,
                      '$match'
                    );
                    const session = new EditSession(
                      '/**\n * query - The query in MQL.\n */$\n{\n \n}',
                      new Mode()
                    );
                    const position = { row: 2, column: 4 };

                    completer.getCompletions(
                      mockEditor,
                      session,
                      position,
                      '$',
                      (error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(31);
                      }
                    );
                  });
                }
              );

              context(
                'when an input symbol is after a comment in expression',
                function () {
                  it('returns results', function () {
                    const completer = new StageAutoCompleter(
                      '3.4.0',
                      textCompleter,
                      fields,
                      '$match'
                    );
                    const session = new EditSession(
                      '/**\n * query - The query in MQL.\n */\n{\n $\n}',
                      new Mode()
                    );
                    const position = { row: 4, column: 2 };

                    completer.getCompletions(
                      mockEditor,
                      session,
                      position,
                      '$',
                      (error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(31);
                      }
                    );
                  });
                }
              );
            });
          });

          context('when a comment block is after expression', function () {
            context('when a comment block is multiline', function () {
              context('when an input symbol is before a comment', function () {
                it('returns results', function () {
                  const completer = new StageAutoCompleter(
                    '3.4.0',
                    textCompleter,
                    fields,
                    '$match'
                  );
                  const session = new EditSession(
                    '{\n \n}\n$/**\n * query - The query in MQL.\n */',
                    new Mode()
                  );
                  const position = { row: 3, column: 1 };

                  completer.getCompletions(
                    mockEditor,
                    session,
                    position,
                    '$',
                    (error, results) => {
                      expect(error).to.equal(null);
                      expect(results.length).to.equal(31);
                    }
                  );
                });
              });

              context(
                'when an input symbol is right after an /** openning tag',
                function () {
                  it('no autocompletion', function () {
                    const completer = new StageAutoCompleter(
                      '3.4.0',
                      textCompleter,
                      fields,
                      '$match'
                    );
                    const session = new EditSession(
                      '{\n \n}\n/**$\n * query - The query in MQL.\n */',
                      new Mode()
                    );
                    const position = { row: 3, column: 4 };

                    completer.getCompletions(
                      mockEditor,
                      session,
                      position,
                      '$',
                      (error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(0);
                      }
                    );
                  });
                }
              );

              context(
                'when an input symbol is right after a comment',
                function () {
                  it('returns results', function () {
                    const completer = new StageAutoCompleter(
                      '3.4.0',
                      textCompleter,
                      fields,
                      '$match'
                    );
                    const session = new EditSession(
                      '{\n \n}\n/**\n * query - The query in MQL.\n */$',
                      new Mode()
                    );
                    const position = { row: 5, column: 4 };

                    completer.getCompletions(
                      mockEditor,
                      session,
                      position,
                      '$',
                      (error, results) => {
                        expect(error).to.equal(null);
                        expect(results.length).to.equal(31);
                      }
                    );
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
