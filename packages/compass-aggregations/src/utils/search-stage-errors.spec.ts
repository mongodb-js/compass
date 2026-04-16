import { expect } from 'chai';
import {
  isSearchIndexDefinitionError,
  isRerankNotEnabledError,
} from './search-stage-errors';

describe('search-stage-errors', function () {
  describe('isSearchIndexDefinitionError', function () {
    context('when error message indicates a definition error', function () {
      const definitionErrors = [
        // geoWithin errors
        "geoWithin requires path 'location' to be indexed as 'geo'",
        "geoWithin requires path 'coordinates.point' to be indexed as 'geo'",

        // geoShape errors
        "geoShape requires path 'area' to be indexed as 'geo' with indexShapes=true",

        // hasAncestor errors
        "hasAncestor requires 'parent' to be indexed as 'embeddedDocuments'",
        "hasAncestor requires path '%s' to be indexed as 'embeddedDocuments'",

        // HasRoot errors
        "HasRoot requires 'root' to be indexed as 'embeddedDocuments'",

        // returnScope errors
        "returnScope path 'nested.doc' must be indexed as embeddedDocument with a non-empty storedSource definitionSyntax.",

        // near with geo point errors
        "near with a geo point origin requires path 'location' to be indexed as 'geo'",

        // autocomplete errors
        'autocomplete index field definition not present at path title',
        'autocomplete index field definition not present at path nested.field',

        // embeddedDocument errors
        "embeddedDocument requires path 'items' to be indexed as 'embeddedDocuments'",

        // Path needs to be indexed errors
        "Path 'count' needs to be indexed as number",
      ];

      definitionErrors.forEach((errorMessage) => {
        it(`returns true for: "${errorMessage}"`, function () {
          expect(isSearchIndexDefinitionError(errorMessage)).to.be.true;
        });
      });

      it('is case-insensitive', function () {
        expect(
          isSearchIndexDefinitionError(
            "GEOWITHIN REQUIRES PATH 'LOCATION' TO BE INDEXED AS 'GEO'"
          )
        ).to.be.true;
      });
    });

    context(
      'when error message does not indicate a definition error',
      function () {
        const nonDefinitionErrors = [
          // Network/connection errors
          'connection timeout',
          'network error',
          'server unavailable',

          // Authentication errors
          'authentication failed',
          'unauthorized access',

          // Permission errors
          'insufficient privileges',
          'access denied',

          // Generic server errors
          'internal server error',
          'service temporarily unavailable',

          // Index operation errors (not definition-related)
          'index build in progress',
          'index already exists',
          'cannot drop index',

          // Unrelated path mentions
          'file path not found',
          'invalid request path',
        ];

        nonDefinitionErrors.forEach((errorMessage) => {
          it(`returns false for: "${errorMessage}"`, function () {
            expect(isSearchIndexDefinitionError(errorMessage)).to.be.false;
          });
        });
      }
    );

    context('when error message is invalid', function () {
      it('returns false for empty string', function () {
        expect(isSearchIndexDefinitionError('')).to.be.false;
      });

      it('returns false for null', function () {
        expect(
          isSearchIndexDefinitionError(null as unknown as string)
        ).to.be.false;
      });

      it('returns false for undefined', function () {
        expect(
          isSearchIndexDefinitionError(undefined as unknown as string)
        ).to.be.false;
      });
    });
  });

  describe('isRerankNotEnabledError', function () {
    it('returns true when message contains $rerank is not enabled', function () {
      expect(
        isRerankNotEnabledError(
          '$rerank is not enabled for my project. Enable the $rerank Project Setting to run this pipeline.'
        )
      ).to.be.true;
    });

    it('returns false for other rerank errors', function () {
      expect(
        isRerankNotEnabledError('num_docs_to_rerank must be between 1 and 1000')
      ).to.be.false;
    });
  });
});
