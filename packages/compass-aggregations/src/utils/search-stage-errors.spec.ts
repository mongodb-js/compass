import { expect } from 'chai';
import {
  isSearchIndexDefinitionError,
  isRerankNotEnabledError,
  getVoyageProjectRateLimitInfo,
  getSearchExtensionTypeFromStage,
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

  describe('getVoyageProjectRateLimitInfo', function () {
    it('returns rpm info for a project RPM rate limit error', function () {
      expect(
        getVoyageProjectRateLimitInfo(
          `Executor error during aggregate command on namespace: sample_mflix.movies :: caused by :: Voyage API error: HttpError { status: 429, message: "{\\"detail\\":\\"You have exceeded your project's Requests Per Minute (RPM) rate limit of 1 requests per minute for rerank-2.5. See our documentation for ways to avoid this or to increase the project's rate limits on the dashboard: https://www.mongodb.com/docs/voyageai/management/rate-limits/#manage-rate-limits\\"}" }`
        )
      ).to.deep.equal({ type: 'rpm', limit: '1' });
    });

    it('returns rpm info for an EmbeddingProvider RPM rate limit error', function () {
      expect(
        getVoyageProjectRateLimitInfo(
          `Executor error during aggregate command on namespace: sample_mflix.movies :: caused by :: com.xgen.mongot.embedding.exceptions.EmbeddingProviderRateLimitException: Rate limit exceeded (HTTP 429). Response body: {"detail":"You have exceeded your project's Requests Per Minute (RPM) rate limit of 1 requests per minute for voyage-4. See our documentation for ways to avoid this or to increase the project's rate limits on the dashboard: https://www.mongodb.com/docs/voyageai/management/rate-limits/#manage-rate-limits"}`
        )
      ).to.deep.equal({ type: 'rpm', limit: '1' });
    });

    it('returns tpm info for a project TPM rate limit error', function () {
      expect(
        getVoyageProjectRateLimitInfo(
          `Executor error during aggregate command on namespace: sample_mflix.movies :: caused by :: Voyage API error: HttpError { status: 429, message: "{\\"detail\\":\\"You have exceeded the project's Tokens Per Minute (TPM) rate limit of 100 tokens per minute for rerank-2.5. In the minute before this request, you used 0 tokens. See our documentation for ways to avoid or increase the project rate limits on the dashboard. https://www.mongodb.com/docs/voyageai/management/rate-limits/#manage-rate-limits\\"}" }`
        )
      ).to.deep.equal({ type: 'tpm', limit: '100' });
    });

    it('returns billing info for a reduced rate limits error', function () {
      expect(
        getVoyageProjectRateLimitInfo(
          `Executor error during aggregate command on namespace: sample_mflix.movies :: caused by :: com.xgen.mongot.embedding.exceptions.EmbeddingProviderRateLimitException: Rate limit exceeded (HTTP 429). Response body: {"detail":"You have not yet added your payment method in the billing page and will have reduced rate limits of 3 RPM and 10K TPM. To unlock our standard rate limits, please add a payment method in the billing page for the appropriate organization in the user dashboard."}`
        )
      ).to.deep.equal({ type: 'billing' });
    });

    it('returns null for unrelated errors', function () {
      expect(
        getVoyageProjectRateLimitInfo(
          'Executor error during aggregate command on namespace: sample_mflix.movies'
        )
      ).to.be.null;
    });

    it('returns null for a non-429 Voyage API error', function () {
      expect(
        getVoyageProjectRateLimitInfo(
          'Voyage API error: HttpError { status: 500, message: "Internal Server Error" }'
        )
      ).to.be.null;
    });

    it('returns null for a non-Voyage 429 error', function () {
      expect(
        getVoyageProjectRateLimitInfo(
          'HttpError { status: 429, message: "(RPM) rate limit of 10" }'
        )
      ).to.be.null;
    });

    it('returns null for empty string', function () {
      expect(getVoyageProjectRateLimitInfo('')).to.be.null;
    });
  });

  describe('getSearchExtensionTypeFromStage', function () {
    it('returns rerank for $rerank operator', function () {
      expect(getSearchExtensionTypeFromStage('$rerank')).to.equal('rerank');
    });

    it('returns autoEmbedding for $vectorSearch operator', function () {
      expect(getSearchExtensionTypeFromStage('$vectorSearch')).to.equal(
        'autoEmbedding'
      );
    });

    it('returns null for unrelated operators', function () {
      expect(getSearchExtensionTypeFromStage('$search')).to.be.null;
    });
  });
});
