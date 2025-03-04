import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  CLEAR_SAMPLE_DOCUMENTS,
  clearSampleDocuments,
  fetchedValidDocument,
  FETCHED_VALID_DOCUMENT,
  fetchedInvalidDocument,
  FETCHED_INVALID_DOCUMENT,
  fetchingValidDocumentFailed,
  FETCHING_INVALID_DOCUMENT_FAILED,
  fetchingInvalidDocumentFailed,
  FETCHING_VALID_DOCUMENT_FAILED,
  fetchingSampleDocuments,
  FETCHING_SAMPLE_DOCUMENTS,
  type SampleDocumentState,
} from './sample-documents';

const SAMPLE_DOCUMENT = {
  name: 'MONGODB_SAMPLE',
};

describe('sample-documents module', function () {
  describe('#actions', function () {
    it('returns the CLEAR_SAMPLE_DOCUMENTS action', function () {
      expect(clearSampleDocuments()).to.deep.equal({
        type: CLEAR_SAMPLE_DOCUMENTS,
      });
    });

    it('returns the FETCHING_VALID_DOCUMENT action', function () {
      expect(fetchingSampleDocuments()).to.deep.equal({
        type: FETCHING_SAMPLE_DOCUMENTS,
      });
    });

    it('returns the FETCHED_VALID_DOCUMENT action', function () {
      for (const document of [undefined, SAMPLE_DOCUMENT] as any[]) {
        expect(fetchedValidDocument(document)).to.deep.equal({
          type: FETCHED_VALID_DOCUMENT,
          document,
        });
      }
    });

    it('returns the FETCHED_INVALID_DOCUMENT action', function () {
      for (const document of [undefined, SAMPLE_DOCUMENT] as any[]) {
        expect(fetchedInvalidDocument(document)).to.deep.equal({
          type: FETCHED_INVALID_DOCUMENT,
          document,
        });
      }
    });

    it('returns the FETCHING_VALID_DOCUMENT_FAILED action', function () {
      expect(fetchingValidDocumentFailed()).to.deep.equal({
        type: FETCHING_VALID_DOCUMENT_FAILED,
      });
    });

    it('returns the FETCHING_INVALID_DOCUMENT_FAILED action', function () {
      expect(fetchingInvalidDocumentFailed()).to.deep.equal({
        type: FETCHING_INVALID_DOCUMENT_FAILED,
      });
    });
  });

  describe('#reducers', function () {
    context(
      'when the action is not presented in sample-documents module',
      function () {
        it('returns the default state', function () {
          expect(reducer(undefined, { type: 'test' } as any)).to.deep.equal(
            INITIAL_STATE
          );
        });
      }
    );

    context('when the action is CLEAR_SAMPLE_DOCUMENTS', function () {
      it('returns the intial state', function () {
        expect(reducer(undefined, clearSampleDocuments())).to.deep.equal(
          INITIAL_STATE
        );
      });
    });

    context('when the action is FETCHING_SAMPLE_DOCUMENTS', function () {
      it('returns a loading state', function () {
        const sampleDocuments = reducer(undefined, fetchingSampleDocuments());
        expect(sampleDocuments.validDocumentState).to.equal('loading');
        expect(sampleDocuments.invalidDocumentState).to.equal('loading');
      });
    });

    context('fetch results', function () {
      let loadingState: SampleDocumentState;
      beforeEach(function () {
        loadingState = reducer(undefined, fetchingSampleDocuments());
      });

      context('when the action is FETCHED_VALID_DOCUMENT', function () {
        it('updates the state with the document', function () {
          for (const document of [null, undefined, SAMPLE_DOCUMENT] as any[]) {
            const sampleDocuments = reducer(
              loadingState,
              fetchedValidDocument(document)
            );
            expect(sampleDocuments.validDocumentState).to.equal('success');
            expect(sampleDocuments.validDocument).to.deep.equal(document);
            expect(sampleDocuments.invalidDocumentState).to.equal('loading');
          }
        });
      });

      context('when the action is FETCHED_INVALID_DOCUMENT', function () {
        for (const document of [null, undefined, SAMPLE_DOCUMENT] as any[]) {
          const sampleDocuments = reducer(
            loadingState,
            fetchedInvalidDocument(document)
          );
          expect(sampleDocuments.invalidDocumentState).to.equal('success');
          expect(sampleDocuments.invalidDocument).to.deep.equal(document);
          expect(sampleDocuments.validDocumentState).to.equal('loading');
        }
      });

      context('when the action is FETCHING_VALID_DOCUMENT_FAILED', function () {
        it('updates an error state', function () {
          const sampleDocuments = reducer(
            loadingState,
            fetchingValidDocumentFailed()
          );
          expect(sampleDocuments.validDocumentState).to.equal('error');
          expect(sampleDocuments.validDocument).to.equal(undefined);
          expect(sampleDocuments.invalidDocumentState).to.equal('loading');
        });
      });

      context(
        'when the action is FETCHING_INVALID_DOCUMENT_FAILED',
        function () {
          it('updates an error state', function () {
            const sampleDocuments = reducer(
              loadingState,
              fetchingInvalidDocumentFailed()
            );
            expect(sampleDocuments.invalidDocumentState).to.equal('error');
            expect(sampleDocuments.invalidDocument).to.deep.equal(undefined);
            expect(sampleDocuments.validDocumentState).to.equal('loading');
          });
        }
      );
    });
  });
});
