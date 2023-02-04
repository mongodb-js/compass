import { connect } from 'react-redux';
import {
  fetchValidDocument,
  fetchInvalidDocument,
} from '../../modules/sample-documents';

import DocumentPreview from './document-preview';

const ValidDocumentPreview = connect(
  (state) => ({
    document: state.sampleDocuments.validDocument,
    loadingState: state.sampleDocuments.validDocumentState,
  }),
  {
    onLoadSampleClick: fetchValidDocument,
  }
)(DocumentPreview);

const InvalidDocumentPreview = connect(
  (state) => ({
    document: state.sampleDocuments.invalidDocument,
    loadingState: state.sampleDocuments.invalidDocumentState,
  }),
  {
    onLoadSampleClick: fetchInvalidDocument,
  }
)(DocumentPreview);

export default DocumentPreview;
export { DocumentPreview, ValidDocumentPreview, InvalidDocumentPreview };
