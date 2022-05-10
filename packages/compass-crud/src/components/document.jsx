import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import HadronDocument from 'hadron-document';
import EditableDocument from './editable-document';
import ReadonlyDocument from './readonly-document';

const Document = (props) => {
  const {
    editable,
    isTimeSeries,
    copyToClipboard,
    openInsertDocumentDialog,
    doc: _doc,
  } = props;

  const doc = useMemo(() => {
    if (_doc?.isRoot()) {
      return _doc;
    }
    return new HadronDocument(_doc);
  }, [_doc]);

  if (editable && isTimeSeries) {
    return (
      <ReadonlyDocument
        doc={doc}
        copyToClipboard={copyToClipboard}
        openInsertDocumentDialog={openInsertDocumentDialog}
      />
    );
  }

  if (editable) {
    return <EditableDocument {...props} doc={doc} />;
  }

  return <ReadonlyDocument doc={doc} copyToClipboard={copyToClipboard} />;
};

Document.propTypes = {
  doc: PropTypes.object.isRequired,
  editable: PropTypes.bool,
  isTimeSeries: PropTypes.bool,
  removeDocument: PropTypes.func,
  replaceDocument: PropTypes.func,
  updateDocument: PropTypes.func,
  openInsertDocumentDialog: PropTypes.func,
  copyToClipboard: PropTypes.func
};

export default Document;
