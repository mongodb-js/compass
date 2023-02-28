import { expect } from 'chai';
import { QUERY_OPERATORS } from '@mongodb-js/mongodb-constants';
import { QueryAutoCompleter } from './query-autocompleter';
import { setupCompleter } from '../../test/completer';

const setupQueryCompleter = setupCompleter.bind(null, QueryAutoCompleter);

describe('QueryAutoCompleter', function () {
  describe('#getCompletions', function () {
    context('when the fields are empty', function () {
      const { getCompletions } = setupQueryCompleter('');

      it('returns no results', function () {
        getCompletions((error, results) => {
          expect(error).to.equal(null);
          expect(results).to.deep.equal([]);
        });
      });
    });

    context('when the current token is a string', function () {
      context('when there are no previous autocompletions', function () {
        const { getCompletions } = setupQueryCompleter('');

        it('returns no results', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([]);
          });
        });
      });

      context('when the string is a $', function () {
        const { getCompletions } = setupQueryCompleter('{ $');

        it('returns all the query operators', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal(
              QUERY_OPERATORS.map((op) => {
                return {
                  value: op.value,
                  meta: op.meta,
                  score: op.score,
                };
              })
            );
          });
        });
      });

      context('when the string is $a', function () {
        const { getCompletions } = setupQueryCompleter('{ $a');

        it('returns all the matching query operators', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([
              {
                value: '$all',
                score: 1,
                meta: 'query',
              },
              {
                value: '$and',
                score: 1,
                meta: 'query',
              },
            ]);
          });
        });
      });

      context('when the string matches a bson type', function () {
        const { getCompletions } = setupQueryCompleter('{ N');

        it('returns all the matching query operators', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([
              {
                value: 'NumberInt',
                score: 1,
                meta: 'bson',
                description: 'BSON 32 bit Integer type',
                snippet: 'NumberInt(${1:value})',
              },
              {
                value: 'NumberLong',
                score: 1,
                meta: 'bson',
                description: 'BSON 64 but Integer type',
                snippet: 'NumberLong(${1:value})',
              },
              {
                value: 'NumberDecimal',
                score: 1,
                meta: 'bson',
                description: 'BSON Decimal128 type',
                snippet: "NumberDecimal('${1:value}')",
              },
            ]);
          });
        });
      });

      context('when the version doesnt match all operators', function () {
        const { getCompletions } = setupQueryCompleter('{ $', {
          serverVersion: '3.4.0',
        });

        it('returns all the query operators', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results.length).to.equal(QUERY_OPERATORS.length - 2);
          });
        });
      });

      context('when the query prefix matches one of the fields', function () {
        const { getCompletions } = setupQueryCompleter('{ pi', {
          serverVersion: '3.4.0',
          fields: [{ name: 'pineapple' }, { name: 'noMatches' }],
        });

        it('returns all the query operators', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results.length).to.equal(1);
            expect(results).to.deep.equal([
              {
                value: 'pineapple',
                score: 1,
                meta: 'field:identifier',
              },
            ]);
          });
        });
      });

      context(
        'when the query prefix has matching nested field names',
        function () {
          const { getCompletions } = setupQueryCompleter('{ pi', {
            serverVersion: '3.4.0',
            fields: [
              {
                name: 'pineapple',
                score: 1,
                meta: 'field',
              },
              {
                name: 'pineapple.price',
                score: 1,
                meta: 'field',
              },
              {
                name: 'pineapple price',
                score: 1,
                meta: 'field',
              },
              {
                name: 'pineapple@price',
                score: 1,
                meta: 'field',
              },
              {
                name: 'pineapple"price',
                score: 1,
                meta: 'field',
              },
              {
                name: 'pineapple.fronds',
                score: 1,
                meta: 'field',
              },
              {
                value: 'noMatches',
                score: 1,
                meta: 'field',
              },
            ],
          });

          it('returns all the query operators', function () {
            getCompletions((error, results) => {
              expect(error).to.equal(null);
              expect(results.length).to.equal(6);
              expect(results).to.deep.equal([
                {
                  value: 'pineapple',
                  score: 1,
                  meta: 'field:identifier',
                },
                {
                  value: '"pineapple.price"',
                  score: 1,
                  meta: 'field:identifier',
                },
                {
                  value: '"pineapple price"',
                  score: 1,
                  meta: 'field:identifier',
                },
                {
                  value: '"pineapple@price"',
                  score: 1,
                  meta: 'field:identifier',
                },
                {
                  value: '"pineapple\\"price"',
                  score: 1,
                  meta: 'field:identifier',
                },
                {
                  value: '"pineapple.fronds"',
                  score: 1,
                  meta: 'field:identifier',
                },
              ]);
            });
          });
        }
      );

      context('when the version doesnt match a bson type', function () {
        const { getCompletions } = setupQueryCompleter('{ N', {
          serverVersion: '3.2.0',
        });

        it('returns all the query operators', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([
              {
                value: 'NumberInt',
                score: 1,
                meta: 'bson',
                description: 'BSON 32 bit Integer type',
                snippet: 'NumberInt(${1:value})',
              },
              {
                value: 'NumberLong',
                score: 1,
                meta: 'bson',
                description: 'BSON 64 but Integer type',
                snippet: 'NumberLong(${1:value})',
              },
            ]);
          });
        });
      });
    });
  });
});
