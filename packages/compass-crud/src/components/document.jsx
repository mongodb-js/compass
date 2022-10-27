import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import HadronDocument from 'hadron-document';
import EditableDocument from './editable-document';
import ReadonlyDocument from './readonly-document';

const Document = (props) => {
  const {
    editable,
    isTimeSeries,
    expandAll,
    copyToClipboard,
    openInsertDocumentDialog,
    doc: _doc,
  } = props;

  const doc = useMemo(() => {
    // COMPASS-5872 If _doc is a plain js object rather than an instance of hadron-document Document
    // it may have an isRoot prop, which would cause the isRoot() to throw an error.
    if (typeof _doc?.isRoot === 'function' && _doc?.isRoot()) {
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
        expandAll={expandAll}
      />
    );
  }

  if (editable) {
    return <EditableDocument {...props} doc={doc} />;
  }

  return (
    <ReadonlyDocument
      doc={doc}
      copyToClipboard={copyToClipboard}
      expandAll={expandAll}
    />
  );
};

Document.propTypes = {
  doc: PropTypes.object.isRequired,
  editable: PropTypes.bool,
  isTimeSeries: PropTypes.bool,
  removeDocument: PropTypes.func,
  replaceDocument: PropTypes.func,
  updateDocument: PropTypes.func,
  openInsertDocumentDialog: PropTypes.func,
  copyToClipboard: PropTypes.func,
  expandAll: PropTypes.bool,
};

export default Document;
