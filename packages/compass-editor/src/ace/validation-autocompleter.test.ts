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
            expect(results).to.deep.equal(QUERY_OPERATORS);
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
                name: '$all',
                value: '$all',
                score: 1,
                meta: 'query',
                version: '2.2.0',
                geospatial: false,
              },
              {
                name: '$and',
                value: '$and',
                score: 1,
                meta: 'query',
                version: '2.2.0',
                geospatial: false,
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
                name: 'type',
                value: 'type',
                label: 'type',
                score: 1,
                meta: 'json-schema',
                version: '3.6.0',
                description: 'Enumerates the possible JSON types of the field',
              },
              {
                name: 'title',
                value: 'title',
                label: 'title',
                score: 1,
                meta: 'json-schema',
                version: '3.6.0',
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
                  name: 'minKey',
                  value: 'minKey',
                  label: 'minKey',
                  score: 1,
                  meta: 'bson-type-aliases',
                  version: '3.6.0',
                },
                {
                  name: 'maxKey',
                  value: 'maxKey',
                  label: 'maxKey',
                  score: 1,
                  meta: 'bson-type-aliases',
                  version: '3.6.0',
                },
              ]);
            });
          });
        }
      );
    });
  });
});
