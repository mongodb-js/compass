import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  CLEAR_SAMPLE_DOCUMENTS,
  clearSampleDocuments,
  fetchingValidDocument,
  FETCHING_VALID_DOCUMENT,
  fetchedValidDocument,
  FETCHED_VALID_DOCUMENT,
  fetchingInvalidDocument,
  FETCHING_INVALID_DOCUMENT,
  fetchedInvalidDocument,
  FETCHED_INVALID_DOCUMENT,
  fetchingValidDocumentFailed,
  FETCHING_INVALID_DOCUMENT_FAILED,
  fetchingInvalidDocumentFailed,
  FETCHING_VALID_DOCUMENT_FAILED,
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
      expect(fetchingValidDocument()).to.deep.equal({
        type: FETCHING_VALID_DOCUMENT,
      });
    });

    it('returns the FETCHING_INVALID_DOCUMENT action', function () {
      expect(fetchingInvalidDocument()).to.deep.equal({
        type: FETCHING_INVALID_DOCUMENT,
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

    context('when the action is FETCHING_VALID_DOCUMENT', function () {
      it('returns a loading state', function () {
        const sampleDocuments = reducer(undefined, fetchingValidDocument());
        expect(sampleDocuments.validDocumentState).to.equal('loading');
      });
    });

    context('when the action is FETCHING_INVALID_DOCUMENT', function () {
      it('returns a loading state', function () {
        const sampleDocuments = reducer(undefined, fetchingInvalidDocument());
        expect(sampleDocuments.invalidDocumentState).to.equal('loading');
      });
    });

    context('when the action is FETCHED_VALID_DOCUMENT', function () {
      it('updates the state with the document', function () {
        for (const document of [null, undefined, SAMPLE_DOCUMENT] as any[]) {
          const sampleDocuments = reducer(
            undefined,
            fetchedValidDocument(document)
          );
          expect(sampleDocuments.validDocumentState).to.equal('success');
          expect(sampleDocuments.validDocument).to.deep.equal(document);
        }
      });
    });

    context('when the action is FETCHED_INVALID_DOCUMENT', function () {
      it('updates the state with the document', function () {
        for (const document of [null, undefined, SAMPLE_DOCUMENT] as any[]) {
          const sampleDocuments = reducer(
            undefined,
            fetchedInvalidDocument(document)
          );
          expect(sampleDocuments.invalidDocumentState).to.equal('success');
          expect(sampleDocuments.invalidDocument).to.deep.equal(document);
        }
      });
    });

    context('when the action is FETCHING_VALID_DOCUMENT_FAILED', function () {
      it('updates an error state', function () {
        const sampleDocuments = reducer(
          undefined,
          fetchingValidDocumentFailed()
        );
        expect(sampleDocuments.validDocumentState).to.equal('error');
        expect(sampleDocuments.validDocument).to.equal(undefined);
      });
    });

    context('when the action is FETCHING_INVALID_DOCUMENT_FAILED', function () {
      it('updates an error state', function () {
        const sampleDocuments = reducer(
          undefined,
          fetchingInvalidDocumentFailed()
        );
        expect(sampleDocuments.invalidDocumentState).to.equal('error');
        expect(sampleDocuments.invalidDocument).to.deep.equal(undefined);
      });
    });
  });
});
