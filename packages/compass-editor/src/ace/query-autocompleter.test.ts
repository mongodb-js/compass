import type { Ace } from 'ace-builds';
import { EditSession } from 'ace-builds';
import sinon from 'sinon';
import { expect } from 'chai';
import { Mode } from 'ace-builds/src-noconflict/mode-javascript';
import { textCompleter } from 'ace-builds/src-noconflict/ext-language_tools';
import { QUERY_OPERATORS } from '@mongodb-js/mongodb-constants';
import { QueryAutoCompleter } from './query-autocompleter';

describe('QueryAutoCompleter', function () {
  const fields = [
    {
      name: 'name',
      value: 'name',
      score: 1,
      meta: 'field',
      version: '0.0.0',
    },
    {
      name: 'name.first',
      value: 'name.first',
      score: 1,
      meta: 'field',
      version: '0.0.0',
    },
  ];
  const editor = sinon.spy() as unknown as Ace.Editor;

  describe('#getCompletions', function () {
    context('when fields is null', function () {
      const completer = new QueryAutoCompleter('3.4.0', textCompleter, []);
      const session = new EditSession('', new Mode());
      const position = { row: 0, column: 0 };

      it('returns no results', function () {
        completer.getCompletions(
          editor,
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

    context('when the fields are empty', function () {
      const completer = new QueryAutoCompleter('3.4.0', textCompleter, []);
      const session = new EditSession('', new Mode());
      const position = { row: 0, column: 0 };

      it('returns no results', function () {
        completer.getCompletions(
          editor,
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

    context('when the current token is a string', function () {
      context('when there are no previous autocompletions', function () {
        const completer = new QueryAutoCompleter(
          '3.4.0',
          textCompleter,
          fields
        );
        const session = new EditSession('', new Mode());
        const position = { row: 0, column: 0 };

        it('returns no results', function () {
          completer.getCompletions(
            editor,
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

      context('when the string is a $', function () {
        const completer = new QueryAutoCompleter(
          '3.6.0',
          textCompleter,
          fields
        );
        const session = new EditSession('{ $ }', new Mode());
        const position = { row: 0, column: 2 };

        it('returns all the query operators', function () {
          completer.getCompletions(
            editor,
            session,
            position,
            '$',
            (error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal(QUERY_OPERATORS);
            }
          );
        });
      });

      context('when the string is $a', function () {
        const completer = new QueryAutoCompleter(
          '3.6.0',
          textCompleter,
          fields
        );
        const session = new EditSession('{ $a }', new Mode());
        const position = { row: 0, column: 3 };

        it('returns all the matching query operators', function () {
          completer.getCompletions(
            editor,
            session,
            position,
            '$a',
            (error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  name: '$all',
                  value: '$all',
                  score: 1,
                  meta: 'query',
                  version: '2.2.0',
                },
                {
                  name: '$and',
                  value: '$and',
                  score: 1,
                  meta: 'query',
                  version: '2.2.0',
                },
              ]);
            }
          );
        });
      });

      context('when the string matches a bson type', function () {
        const completer = new QueryAutoCompleter(
          '3.6.0',
          textCompleter,
          fields
        );
        const session = new EditSession('{ N }', new Mode());
        const position = { row: 0, column: 2 };

        it('returns all the matching query operators', function () {
          completer.getCompletions(
            editor,
            session,
            position,
            'N',
            (error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  name: 'NumberInt',
                  value: 'NumberInt',
                  label: 'NumberInt',
                  score: 1,
                  meta: 'bson',
                  version: '0.0.0',
                  description: 'BSON 32 bit Integer type',
                  snippet: 'NumberInt(${1:value})',
                },
                {
                  name: 'NumberLong',
                  value: 'NumberLong',
                  label: 'NumberLong',
                  score: 1,
                  meta: 'bson',
                  version: '0.0.0',
                  description: 'BSON 64 but Integer type',
                  snippet: 'NumberLong(${1:value})',
                },
                {
                  name: 'NumberDecimal',
                  value: 'NumberDecimal',
                  label: 'NumberDecimal',
                  score: 1,
                  meta: 'bson',
                  version: '3.4.0',
                  description: 'BSON Decimal128 type',
                  snippet: "NumberDecimal('${1:value}')",
                },
              ]);
            }
          );
        });
      });

      context('when the version doesnt match all operators', function () {
        const completer = new QueryAutoCompleter(
          '3.4.0',
          textCompleter,
          fields
        );
        const session = new EditSession('{ $ }', new Mode());
        const position = { row: 0, column: 2 };

        it('returns all the query operators', function () {
          completer.getCompletions(
            editor,
            session,
            position,
            '$',
            (error, results) => {
              expect(error).to.equal(null);
              expect(results.length).to.equal(QUERY_OPERATORS.length - 2);
            }
          );
        });
      });

      context('when the version doesnt match a bson type', function () {
        const completer = new QueryAutoCompleter(
          '3.2.0',
          textCompleter,
          fields
        );
        const session = new EditSession('{ N }', new Mode());
        const position = { row: 0, column: 2 };

        it('returns all the query operators', function () {
          completer.getCompletions(
            editor,
            session,
            position,
            'N',
            (error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  name: 'NumberInt',
                  value: 'NumberInt',
                  label: 'NumberInt',
                  score: 1,
                  meta: 'bson',
                  version: '0.0.0',
                  description: 'BSON 32 bit Integer type',
                  snippet: 'NumberInt(${1:value})',
                },
                {
                  name: 'NumberLong',
                  value: 'NumberLong',
                  label: 'NumberLong',
                  score: 1,
                  meta: 'bson',
                  version: '0.0.0',
                  description: 'BSON 64 but Integer type',
                  snippet: 'NumberLong(${1:value})',
                },
              ]);
            }
          );
        });
      });
    });
  });
});
