import { EditSession } from 'brace';
import ace from 'brace';
import Completer from 'models/completer';
import EXPRESSION_OPERATORS from 'constants/expression-operators';
import store from 'stores';
import { stageOperatorSelected } from 'modules/stages';

const { Mode } = ace.acequire('ace/mode/javascript');
const textCompleter = ace.acequire('ace/ext/language_tools').textCompleter;

describe('Completer', () => {
  const fields = [
    { name: 'name', value: 'name', score: 1, meta: 'field', version: '0.0.0' }
  ];
  const editor = sinon.spy();

  afterEach(() => {
    store.dispatch(stageOperatorSelected(0, null));
  });

  describe('#getCompletions', () => {
    context('when the current token is a string', () => {
      context('when there are no previous autocompletions', () => {
        const completer = new Completer('3.4.0', textCompleter, 0, fields);
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
          const completer = new Completer('3.4.0', textCompleter, 0, fields);
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
          const completer = new Completer('3.4.0', textCompleter, 0, fields);
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
            const completer = new Completer('3.4.0', textCompleter, 0, fields);
            const session = new EditSession('', new Mode());
            const position = { row: 0, column: 0 };

            it('returns no results', () => {
              completer.getCompletions(editor, session, position, '', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([]);
              });
            });
          });

          context('when the prefix begins with a letter', () => {
            context('when the token is on the same line', () => {
              const completer = new Completer('3.6.0', textCompleter, 0, fields);
              const session = new EditSession('{ n', new Mode());
              const position = { row: 0, column: 2 };

              it('returns all the matching field names', () => {
                completer.getCompletions(editor, session, position, 'n', (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal([
                    { name: 'name', value: 'name', score: 1, meta: 'field', version: '0.0.0' }
                  ]);
                });
              });
            });
          });

          context('when the prefix begins with $', () => {
            context('when the token is on the same line', () => {
              const completer = new Completer('3.6.0', textCompleter, 0, fields);
              const session = new EditSession('{ $', new Mode());
              const position = { row: 0, column: 2 };

              it('returns all the expression operators', () => {
                completer.getCompletions(editor, session, position, '$', (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal(EXPRESSION_OPERATORS);
                });
              });
            });

            context('when the token is on another line', () => {
              const completer = new Completer('3.6.0', textCompleter, 0, fields);
              const session = new EditSession('{\n  $', new Mode());
              const position = { row: 1, column: 3 };

              it('returns all the expression operators', () => {
                completer.getCompletions(editor, session, position, '$', (error, results) => {
                  expect(error).to.equal(null);
                  expect(results).to.deep.equal(EXPRESSION_OPERATORS);
                });
              });
            });
          });

          context('when the prefix begins with an unknown', () => {
            const completer = new Completer('3.4.0', textCompleter, 0, fields);
            const session = new EditSession('{ $notAnOp', new Mode());
            const position = { row: 0, column: 9 };

            it('returns none of the expression operators', () => {
              completer.getCompletions(editor, session, position, '$notAnOp', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([]);
              });
            });
          });

          context('when the prefix begins with $a', () => {
            const completer = new Completer('3.4.0', textCompleter, 0, fields);
            const session = new EditSession('{ $a', new Mode());
            const position = { row: 0, column: 3 };

            it('returns all the expression operators starting with $a', () => {
              completer.getCompletions(editor, session, position, '$a', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$abs',
                    value: '$abs',
                    score: 1,
                    meta: 'expr:arith',
                    version: '3.2.0'
                  },
                  {
                    name: '$add',
                    value: '$add',
                    score: 1,
                    meta: 'expr:arith',
                    version: '2.2.0'
                  },
                  {
                    name: '$allElementsTrue',
                    value: '$allElementsTrue',
                    score: 1,
                    meta: 'expr:set',
                    version: '2.6.0'
                  },
                  {
                    name: '$and',
                    value: '$and',
                    score: 1,
                    meta: 'expr:bool',
                    version: '2.2.0'
                  },
                  {
                    name: '$anyElementTrue',
                    value: '$anyElementTrue',
                    score: 1,
                    meta: 'expr:set',
                    version: '2.6.0'
                  },
                  {
                    name: '$arrayElemAt',
                    value: '$arrayElemAt',
                    score: 1,
                    meta: 'expr:array',
                    version: '3.2.0'
                  }
                ]);
              });
            });
          });

          context('when the prefix begins with $co', () => {
            const completer = new Completer('3.4.0', textCompleter, 0, fields);
            const session = new EditSession('{ $co', new Mode());
            const position = { row: 0, column: 4 };

            it('returns all the expression operators starting with $co', () => {
              completer.getCompletions(editor, session, position, '$co', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$concat',
                    value: '$concat',
                    score: 1,
                    meta: 'expr:string',
                    version: '2.4.0'
                  },
                  {
                    name: '$concatArrays',
                    value: '$concatArrays',
                    score: 1,
                    meta: 'expr:array',
                    version: '3.2.0'
                  },
                  {
                    name: '$cond',
                    value: '$cond',
                    score: 1,
                    meta: 'expr:cond',
                    version: '2.6.0'
                  }
                ]);
              });
            });
          });

          context('when the prefix begins with $sec', () => {
            const completer = new Completer('3.4.0', textCompleter, 0, fields);
            const session = new EditSession('{ $sec', new Mode());
            const position = { row: 0, column: 4 };

            it('returns all the expression operators starting with $sec', () => {
              completer.getCompletions(editor, session, position, '$sec', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$second',
                    value: '$second',
                    score: 1,
                    meta: 'expr:date',
                    version: '2.2.0'
                  }
                ]);
              });
            });
          });
        });

        context('when the version is provided', () => {
          const completer = new Completer('3.0.0', null, 0, fields);
          const session = new EditSession('{ $si', new Mode());
          const position = { row: 0, column: 4 };

          it('returns available operators for the version', () => {
            completer.getCompletions(editor, session, position, '$si', (error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  name: '$size',
                  value: '$size',
                  score: 1,
                  meta: 'expr:array',
                  version: '2.6.0'
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
              const completer = new Completer('3.2.0', null, 0, fields);
              const session = new EditSession('{ $m', new Mode());
              const position = { row: 0, column: 3 };

              beforeEach(() => {
                store.dispatch(stageOperatorSelected(0, '$project'));
              });

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
              const completer = new Completer('3.2.0', null, 0, fields);
              const session = new EditSession('{\n  $m', new Mode());
              const position = { row: 1, column: 4 };

              beforeEach(() => {
                store.dispatch(stageOperatorSelected(0, '$project'));
              });

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
              const completer = new Completer('3.4.0', null, 0, fields);
              const session = new EditSession('{ $m', new Mode());
              const position = { row: 0, column: 3 };

              beforeEach(() => {
                store.dispatch(stageOperatorSelected(0, '$project'));
              });

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
              const completer = new Completer('3.4.0', null, 0, fields);
              const session = new EditSession('{ $p', new Mode());
              const position = { row: 0, column: 3 };

              beforeEach(() => {
                store.dispatch(stageOperatorSelected(0, '$project'));
              });

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
            const completer = new Completer('3.0.0', null, 0, fields);
            const session = new EditSession('{ $e', new Mode());
            const position = { row: 0, column: 3 };

            beforeEach(() => {
              store.dispatch(stageOperatorSelected(0, '$project'));
            });

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
            const completer = new Completer('3.2.0', null, 0, fields);
            const session = new EditSession('{ $m', new Mode());
            const position = { row: 0, column: 3 };

            beforeEach(() => {
              store.dispatch(stageOperatorSelected(0, '$group'));
            });

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
            const completer = new Completer('3.4.0', null, 0, fields);
            const session = new EditSession('{ $p', new Mode());
            const position = { row: 0, column: 3 };

            beforeEach(() => {
              store.dispatch(stageOperatorSelected(0, '$group'));
            });

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
            const completer = new Completer('3.0.0', null, 0, fields);
            const session = new EditSession('{ $e', new Mode());
            const position = { row: 0, column: 3 };

            beforeEach(() => {
              store.dispatch(stageOperatorSelected(0, '$group'));
            });

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
            const completer = new Completer('3.4.5', null, 0, fields);
            const session = new EditSession('{ $ar', new Mode());
            const position = { row: 0, column: 4 };

            beforeEach(() => {
              store.dispatch(stageOperatorSelected(0, '$match'));
            });

            it('returns matching expression operators for the version', () => {
              completer.getCompletions(editor, session, position, '$ar', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$arrayElemAt',
                    value: '$arrayElemAt',
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
            const completer = new Completer('3.4.0', null, 0, fields);
            const session = new EditSession('{ $ar', new Mode());
            const position = { row: 0, column: 4 };

            beforeEach(() => {
              store.dispatch(stageOperatorSelected(0, '$match'));
            });

            it('returns matchin expression operators for the version', () => {
              completer.getCompletions(editor, session, position, '$ar', (error, results) => {
                expect(error).to.equal(null);
                expect(results).to.deep.equal([
                  {
                    name: '$arrayElemAt',
                    value: '$arrayElemAt',
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
