import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import HadronDocument from 'hadron-document';
import type { EditableDocumentProps } from './editable-document';
import EditableDocument from './editable-document';
import type { ReadonlyDocumentProps } from './readonly-document';
import ReadonlyDocument from './readonly-document';
import type { BSONObject } from '../stores/crud-store';

export type DocumentProps = {
  doc: HadronDocument | BSONObject;
  editable: boolean;
  isTimeSeries?: boolean;
  onUpdateQuery?: (field: string, value: unknown) => void;
  query?: BSONObject;
} & Omit<EditableDocumentProps, 'doc' | 'expandAll'> &
  Pick<ReadonlyDocumentProps, 'copyToClipboard' | 'openInsertDocumentDialog'>;

const Document = (props: DocumentProps) => {
  const {
    editable,
    isTimeSeries,
    copyToClipboard,
    openInsertDocumentDialog,
    doc: _doc,
    onUpdateQuery,
    query,
  } = props;

  const doc = useMemo(() => {
    // COMPASS-5872 If _doc is a plain js object rather than an instance of hadron-document Document
    // it may have an isRoot prop, which would cause the isRoot() to throw an error.
    if (typeof _doc?.isRoot === 'function' && _doc?.isRoot()) {
      return _doc as HadronDocument;
    }
    return new HadronDocument(_doc as Record<string, unknown>);
  }, [_doc]);

  if (editable && isTimeSeries) {
    return (
      <ReadonlyDocument
        doc={doc}
        copyToClipboard={copyToClipboard}
        openInsertDocumentDialog={(doc, cloned) => {
          void openInsertDocumentDialog?.(doc, cloned);
        }}
        onUpdateQuery={onUpdateQuery}
        query={query}
      />
    );
  }

  if (editable) {
    return (
      <EditableDocument
        {...props}
        doc={doc}
        onUpdateQuery={onUpdateQuery}
        query={query}
      />
    );
  }

  return (
    <ReadonlyDocument
      doc={doc}
      copyToClipboard={copyToClipboard}
      onUpdateQuery={onUpdateQuery}
      query={query}
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
  isExpanded: PropTypes.bool,
};

export default React.memo(Document);
