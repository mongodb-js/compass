import { EditSession } from 'brace';
import ace from 'brace';
import Completer from 'models/completer';
import STAGE_OPERATORS from 'constants/stage-operators';

const { Mode } = ace.acequire('ace/mode/javascript');
const textCompleter = ace.acequire('ace/ext/language_tools').textCompleter;

describe('Completer', () => {
  const editor = sinon.spy();

  describe('#getCompletions', () => {
    context('when the current token is a string', () => {
      context('when there are no previous autocompletions', () => {
        const completer = new Completer('3.4.0', textCompleter);
        const session = new EditSession('', new Mode());
        const position = { row: 0, column: 0 };

        it('returns no results', () => {
          completer.getCompletions(editor, session, position, '', (error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([]);
          });
        });
      });

      context('when there are previous autocompletions', () => {
        context('when the latest token is a string', () => {
          const completer = new Completer('3.4.0', textCompleter);
          const session = new EditSession('{ $project: { "$', new Mode());
          const position = { row: 0, column: 15 };

          it('returns only the previous results', () => {
            completer.getCompletions(editor, session, position, '$', (error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  'caption': '$project',
                  'meta': 'local',
                  'score': 2,
                  'value': '$project'
                }
              ]);
            });
          });
        });
      });

      context('when there are tokens after', () => {
        context('when the latest token is a string', () => {
          const completer = new Completer('3.4.0', textCompleter);
          const session = new EditSession('{ $match: { $and: [ "$var1", "$var2" ]}}', new Mode());
          const position = { row: 0, column: 32 };

          it('returns only the previous results', () => {
            completer.getCompletions(editor, session, position, '$va', (error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  'caption': '$match',
                  'meta': 'local',
                  'score': 3,
                  'value': '$match'
                },
                {
                  'caption': '$and',
                  'meta': 'local',
                  'score': 4,
                  'value': '$and'
                },
                {
                  'caption': '$var1',
                  'meta': 'local',
                  'score': 5,
                  'value': '$var1'
                }
              ]);
            });
          });
        });
      });
    });

    context('when the current token is an identifier', () => {
      context('when no stage operator has been defined', () => {
        context('when the version is not provided', () => {
          context('when the prefix is empty', () => {
            const completer = new Completer('3.4.0', textCompleter);
            const session = new EditSession('', new Mode());
            const position = { row: 0, column: 0 };

            it('returns no results', () => {
              completer.getCompletions(editor, session, position, '', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([]);
              });
            });
          });

          context('when the prefix begins with $', () => {
            context('when the token is on the same line', () => {
              const completer = new Completer('3.6.0');
              const session = new EditSession('{ $', new Mode());
              const position = { row: 0, column: 2 };

              it('returns all the stage operators', () => {
                completer.getCompletions(editor, session, position, '$', (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal(STAGE_OPERATORS);
                });
              });
            });

            context('when the token is on another line', () => {
              const completer = new Completer('3.6.0');
              const session = new EditSession('{\n  $', new Mode());
              const position = { row: 1, column: 3 };

              it('returns all the stage operators', () => {
                completer.getCompletions(editor, session, position, '$', (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal(STAGE_OPERATORS);
                });
              });
            });
          });

          context('when the prefix begins with an unknown', () => {
            const completer = new Completer('3.4.0');
            const session = new EditSession('{ $notAnOp', new Mode());
            const position = { row: 0, column: 9 };

            it('returns none of the stage operators', () => {
              completer.getCompletions(editor, session, position, '$notAnOp', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([]);
              });
            });
          });

          context('when the prefix begins with $a', () => {
            const completer = new Completer('3.4.0');
            const session = new EditSession('{ $a', new Mode());
            const position = { row: 0, column: 3 };

            it('returns all the stage operators starting with $a', () => {
              completer.getCompletions(editor, session, position, '$a', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$addFields',
                    value: '$addFields',
                    score: 1,
                    meta: 'stage',
                    version: '3.4.0'
                  }
                ]);
              });
            });
          });

          context('when the prefix begins with $co', () => {
            const completer = new Completer('3.4.0');
            const session = new EditSession('{ $co', new Mode());
            const position = { row: 0, column: 4 };

            it('returns all the stage operators starting with $co', () => {
              completer.getCompletions(editor, session, position, '$co', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$collStats',
                    value: '$collStats',
                    score: 1,
                    meta: 'stage',
                    version: '3.4.0'
                  },
                  {
                    name: '$count',
                    value: '$count',
                    score: 1,
                    meta: 'stage',
                    version: '2.2.0'
                  }
                ]);
              });
            });
          });

          context('when the prefix begins with $s', () => {
            const completer = new Completer('3.4.0');
            const session = new EditSession('{ $s', new Mode());
            const position = { row: 0, column: 3 };

            it('returns all the stage operators starting with $s', () => {
              completer.getCompletions(editor, session, position, '$s', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$sample',
                    value: '$sample',
                    score: 1,
                    meta: 'stage',
                    version: '3.2.0'
                  },
                  {
                    name: '$skip',
                    value: '$skip',
                    score: 1,
                    meta: 'stage',
                    version: '2.2.0'
                  },
                  {
                    name: '$sort',
                    value: '$sort',
                    score: 1,
                    meta: 'stage',
                    version: '2.2.0'
                  },
                  {
                    name: '$sortByCount',
                    value: '$sortByCount',
                    score: 1,
                    meta: 'stage',
                    version: '3.4.0'
                  }
                ]);
              });
            });
          });
        });

        context('when the version is provided', () => {
          const completer = new Completer('3.0.0');
          const session = new EditSession('{ $s', new Mode());
          const position = { row: 0, column: 3 };

          it('returns available operators for the version', () => {
            completer.getCompletions(editor, session, position, '$s', (error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  name: '$skip',
                  value: '$skip',
                  score: 1,
                  meta: 'stage',
                  version: '2.2.0'
                },
                {
                  name: '$sort',
                  value: '$sort',
                  score: 1,
                  meta: 'stage',
                  version: '2.2.0'
                }
              ]);
            });
          });
        });
      });

      context('when a stage operator has been defined', () => {
        context('when the stage operator is $project', () => {
          context('when the server version is 3.2.0', () => {
            context('when the stage is a single line', () => {
              const completer = new Completer('3.2.0');
              const session = new EditSession('{ $project: { $m', new Mode());
              const position = { row: 0, column: 15 };

              it('returns matching expression operators + $project accumulators', () => {
                completer.getCompletions(editor, session, position, '$m', (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$map',
                      value: '$map',
                      score: 1,
                      meta: 'expr:array',
                      version: '2.6.0'
                    },
                    {
                      name: '$meta',
                      value: '$meta',
                      score: 1,
                      meta: 'expr:text',
                      version: '2.6.0'
                    },
                    {
                      name: '$millisecond',
                      value: '$millisecond',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.4.0'
                    },
                    {
                      name: '$minute',
                      value: '$minute',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.2.0'
                    },
                    {
                      name: '$mod',
                      value: '$mod',
                      score: 1,
                      meta: 'expr:arith',
                      version: '2.2.0'
                    },
                    {
                      name: '$month',
                      value: '$month',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.2.0'
                    },
                    {
                      name: '$multiply',
                      value: '$multiply',
                      score: 1,
                      meta: 'expr:arith',
                      version: '2.2.0'
                    },
                    {
                      name: '$max',
                      value: '$max',
                      score: 1,
                      meta: 'accumulator',
                      version: '2.2.0',
                      projectVersion: '3.2.0'
                    },
                    {
                      name: '$min',
                      value: '$min',
                      score: 1,
                      meta: 'accumulator',
                      version: '2.2.0',
                      projectVersion: '3.2.0'
                    }
                  ]);
                });
              });
            });

            context('when the stage is on multiple lines', () => {
              const completer = new Completer('3.2.0');
              const session = new EditSession('{\n  $project: {\n    $m', new Mode());
              const position = { row: 2, column: 5 };

              it('returns matching expression operators + $project accumulators', () => {
                completer.getCompletions(editor, session, position, '$m', (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$map',
                      value: '$map',
                      score: 1,
                      meta: 'expr:array',
                      version: '2.6.0'
                    },
                    {
                      name: '$meta',
                      value: '$meta',
                      score: 1,
                      meta: 'expr:text',
                      version: '2.6.0'
                    },
                    {
                      name: '$millisecond',
                      value: '$millisecond',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.4.0'
                    },
                    {
                      name: '$minute',
                      value: '$minute',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.2.0'
                    },
                    {
                      name: '$mod',
                      value: '$mod',
                      score: 1,
                      meta: 'expr:arith',
                      version: '2.2.0'
                    },
                    {
                      name: '$month',
                      value: '$month',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.2.0'
                    },
                    {
                      name: '$multiply',
                      value: '$multiply',
                      score: 1,
                      meta: 'expr:arith',
                      version: '2.2.0'
                    },
                    {
                      name: '$max',
                      value: '$max',
                      score: 1,
                      meta: 'accumulator',
                      version: '2.2.0',
                      projectVersion: '3.2.0'
                    },
                    {
                      name: '$min',
                      value: '$min',
                      score: 1,
                      meta: 'accumulator',
                      version: '2.2.0',
                      projectVersion: '3.2.0'
                    }
                  ]);
                });
              });
            });
          });

          context('when the server version is 3.4.0', () => {
            context('when the accumulators are valid in $project', () => {
              const completer = new Completer('3.4.0');
              const session = new EditSession('{ $project: { $m', new Mode());
              const position = { row: 0, column: 15 };

              it('returns matching expression operators + $project accumulators', () => {
                completer.getCompletions(editor, session, position, '$m', (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$map',
                      value: '$map',
                      score: 1,
                      meta: 'expr:array',
                      version: '2.6.0'
                    },
                    {
                      name: '$meta',
                      value: '$meta',
                      score: 1,
                      meta: 'expr:text',
                      version: '2.6.0'
                    },
                    {
                      name: '$millisecond',
                      value: '$millisecond',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.4.0'
                    },
                    {
                      name: '$minute',
                      value: '$minute',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.2.0'
                    },
                    {
                      name: '$mod',
                      value: '$mod',
                      score: 1,
                      meta: 'expr:arith',
                      version: '2.2.0'
                    },
                    {
                      name: '$month',
                      value: '$month',
                      score: 1,
                      meta: 'expr:date',
                      version: '2.2.0'
                    },
                    {
                      name: '$multiply',
                      value: '$multiply',
                      score: 1,
                      meta: 'expr:arith',
                      version: '2.2.0'
                    },
                    {
                      name: '$max',
                      value: '$max',
                      score: 1,
                      meta: 'accumulator',
                      version: '2.2.0',
                      projectVersion: '3.2.0'
                    },
                    {
                      name: '$min',
                      value: '$min',
                      score: 1,
                      meta: 'accumulator',
                      version: '2.2.0',
                      projectVersion: '3.2.0'
                    }
                  ]);
                });
              });
            });

            context('when the accumulators are not valid in $project', () => {
              const completer = new Completer('3.4.0');
              const session = new EditSession('{ $project: { $p', new Mode());
              const position = { row: 0, column: 15 };

              it('returns matching expression operators + $project accumulators', () => {
                completer.getCompletions(editor, session, position, '$p', (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    {
                      name: '$pow',
                      value: '$pow',
                      score: 1,
                      meta: 'expr:arith',
                      version: '3.2.0'
                    }
                  ]);
                });
              });
            });
          });

          context('when the server version is 3.0.0', () => {
            const completer = new Completer('3.0.0');
            const session = new EditSession('{ $project: { $e', new Mode());
            const position = { row: 0, column: 15 };

            it('returns matching expression operators only', () => {
              completer.getCompletions(editor, session, position, '$e', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$eq',
                    value: '$eq',
                    score: 1,
                    meta: 'expr:comp',
                    version: '2.2.0'
                  }
                ]);
              });
            });
          });
        });

        context('when the stage operator is $group', () => {
          context('when the server version is 3.2.0', () => {
            const completer = new Completer('3.2.0');
            const session = new EditSession('{ $group: { $m', new Mode());
            const position = { row: 0, column: 13 };

            it('returns matching expression operators + accumulators', () => {
              completer.getCompletions(editor, session, position, '$m', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$map',
                    value: '$map',
                    score: 1,
                    meta: 'expr:array',
                    version: '2.6.0'
                  },
                  {
                    name: '$meta',
                    value: '$meta',
                    score: 1,
                    meta: 'expr:text',
                    version: '2.6.0'
                  },
                  {
                    name: '$millisecond',
                    value: '$millisecond',
                    score: 1,
                    meta: 'expr:date',
                    version: '2.4.0'
                  },
                  {
                    name: '$minute',
                    value: '$minute',
                    score: 1,
                    meta: 'expr:date',
                    version: '2.2.0'
                  },
                  {
                    name: '$mod',
                    value: '$mod',
                    score: 1,
                    meta: 'expr:arith',
                    version: '2.2.0'
                  },
                  {
                    name: '$month',
                    value: '$month',
                    score: 1,
                    meta: 'expr:date',
                    version: '2.2.0'
                  },
                  {
                    name: '$multiply',
                    value: '$multiply',
                    score: 1,
                    meta: 'expr:arith',
                    version: '2.2.0'
                  },
                  {
                    name: '$max',
                    value: '$max',
                    score: 1,
                    meta: 'accumulator',
                    version: '2.2.0',
                    projectVersion: '3.2.0'
                  },
                  {
                    name: '$min',
                    value: '$min',
                    score: 1,
                    meta: 'accumulator',
                    version: '2.2.0',
                    projectVersion: '3.2.0'
                  }
                ]);
              });
            });
          });

          context('when the server version is 3.4.0', () => {
            const completer = new Completer('3.4.0');
            const session = new EditSession('{ $group: { $p', new Mode());
            const position = { row: 0, column: 13 };

            it('returns matching expression operators + accumulators', () => {
              completer.getCompletions(editor, session, position, '$p', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$pow',
                    value: '$pow',
                    score: 1,
                    meta: 'expr:arith',
                    version: '3.2.0'
                  },
                  {
                    name: '$push',
                    value: '$push',
                    score: 1,
                    meta: 'accumulator',
                    version: '2.2.0'
                  }
                ]);
              });
            });
          });

          context('when the server version is 3.0.0', () => {
            const completer = new Completer('3.0.0');
            const session = new EditSession('{ $group: { $e', new Mode());
            const position = { row: 0, column: 13 };

            it('returns matching expression operators only', () => {
              completer.getCompletions(editor, session, position, '$e', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$eq',
                    value: '$eq',
                    score: 1,
                    meta: 'expr:comp',
                    version: '2.2.0'
                  }
                ]);
              });
            });
          });
        });

        context('when the stage operator is not project or group', () => {
          context('when the version matches all', () => {
            const completer = new Completer('3.4.5');
            const session = new EditSession('{ $match: { $ar', new Mode());
            const position = { row: 0, column: 14 };

            it('returns matching expression operators for the version', () => {
              completer.getCompletions(editor, session, position, '$ar', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$arrayElementAt',
                    value: '$arrayElementAt',
                    score: 1,
                    meta: 'expr:array',
                    version: '3.2.0'
                  },
                  {
                    name: '$arrayToObject',
                    value: '$arrayToObject',
                    score: 1,
                    meta: 'expr:array',
                    version: '3.4.4'
                  }
                ]);
              });
            });
          });

          context('when the version matches a subset', () => {
            const completer = new Completer('3.4.0');
            const session = new EditSession('{ $match: { $ar', new Mode());
            const position = { row: 0, column: 14 };

            it('returns matchin expression operators for the version', () => {
              completer.getCompletions(editor, session, position, '$ar', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$arrayElementAt',
                    value: '$arrayElementAt',
                    score: 1,
                    meta: 'expr:array',
                    version: '3.2.0'
                  }
                ]);
              });
            });
          });
        });
      });
    });
  });
});
