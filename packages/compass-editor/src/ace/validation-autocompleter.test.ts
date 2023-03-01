import { expect } from 'chai';
import { QUERY_OPERATORS } from '@mongodb-js/mongodb-constants';
import { ValidationAutoCompleter } from './validation-autocompleter';
import { setupCompleter } from '../../test/completer';

const setupValidationCompleter = setupCompleter.bind(
  null,
  ValidationAutoCompleter
);

describe('ValidationAutoCompleter', function () {
  describe('#getCompletions', function () {
    context('when the fields are empty', function () {
      const { getCompletions } = setupValidationCompleter('');

      it('returns no results', function () {
        getCompletions((error, results) => {
          expect(error).to.equal(null);
          expect(results).to.deep.equal([]);
        });
      });
    });

    context('when the current token is a string', function () {
      context('when there are no previous autocompletions', function () {
        const { getCompletions } = setupValidationCompleter('');

        it('returns no results', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([]);
          });
        });
      });

      context('when the string is a $', function () {
        const { getCompletions } = setupValidationCompleter('{ $');

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
        const { getCompletions } = setupValidationCompleter('{ $a');

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
        const { getCompletions } = setupValidationCompleter('{ N');

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
              {
                description: 'Field must not match the schema',
                meta: 'json-schema',
                score: 1,
                value: 'not',
              },
            ]);
          });
        });
      });

      context('when the version doesnt match all operators', function () {
        const { getCompletions } = setupValidationCompleter('{ $', {
          serverVersion: '3.4.0',
        });

        it('returns all the query operators', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results.length).to.equal(QUERY_OPERATORS.length - 2);
          });
        });
      });

      context('when the version doesnt match a bson type', function () {
        const { getCompletions } = setupValidationCompleter('{ N', {
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

      context('when query contains $jsonSchema', function () {
        const { getCompletions } =
          setupValidationCompleter('{ $jsonSchema: { t');

        it('returns all the query operators', function () {
          getCompletions((error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([
              {
                description: 'BSON Timestamp type',
                meta: 'bson',
                score: 1,
                snippet: 'Timestamp(${1:low}, ${2:high})',
                value: 'Timestamp',
              },
              {
                value: 'type',
                score: 1,
                meta: 'json-schema',
                description: 'Enumerates the possible JSON types of the field',
              },
              {
                value: 'title',
                score: 1,
                meta: 'json-schema',
                description: 'A descriptive title string with no effect',
              },
            ]);
          });
        });
      });

      context(
        'when query contains $jsonSchema and user enters BSON type aliases',
        function () {
          const { getCompletions } = setupValidationCompleter(
            '{ $jsonSchema: { bsonType: "m'
          );

          it('returns all the query operators', function () {
            getCompletions((error, results) => {
              expect(error).to.equal(null);
              expect(results).to.deep.equal([
                {
                  value: 'minKey',
                  score: 1,
                  meta: 'bson-type-aliases',
                },
                {
                  value: 'maxKey',
                  score: 1,
                  meta: 'bson-type-aliases',
                },
              ]);
            });
          });
        }
      );
    });
  });
});
