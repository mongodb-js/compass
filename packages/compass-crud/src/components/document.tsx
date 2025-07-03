import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import HadronDocument from 'hadron-document';
import type { EditableDocumentProps } from './editable-document';
import EditableDocument from './editable-document';
import type { ReadonlyDocumentProps } from './readonly-document';
import ReadonlyDocument from './readonly-document';
import type { BSONObject } from '../stores/crud-store';
import { useChangeQueryBarQuery } from '@mongodb-js/compass-query-bar';

export type DocumentProps = {
  doc: HadronDocument | BSONObject;
  editable: boolean;
  isTimeSeries?: boolean;
} & Omit<EditableDocumentProps, 'doc' | 'expandAll'> &
  Pick<ReadonlyDocumentProps, 'copyToClipboard' | 'openInsertDocumentDialog'>;

const Document = (props: DocumentProps) => {
  const {
    editable,
    isTimeSeries,
    copyToClipboard,
    openInsertDocumentDialog,
    doc: _doc,
  } = props;

  const doc = useMemo(() => {
    // COMPASS-5872 If _doc is a plain js object rather than an instance of hadron-document Document
    // it may have an isRoot prop, which would cause the isRoot() to throw an error.
    if (typeof _doc?.isRoot === 'function' && _doc?.isRoot()) {
      return _doc as HadronDocument;
    }
    return new HadronDocument(_doc as any);
  }, [_doc]);

  const changeQuery = useChangeQueryBarQuery();

  const onAddToQuery = useCallback(
    (field: string, value: any) => {
      if (changeQuery) {
        changeQuery('setValue', {
          field,
          value,
        });
      }
    },
    [changeQuery]
  );

  if (editable && isTimeSeries) {
    return (
      <ReadonlyDocument
        doc={doc}
        copyToClipboard={copyToClipboard}
        openInsertDocumentDialog={(doc, cloned) => {
          void openInsertDocumentDialog?.(doc, cloned);
        }}
        onAddToQuery={onAddToQuery}
      />
    );
  }

  if (editable) {
    return (
      <EditableDocument {...props} doc={doc} onAddToQuery={onAddToQuery} />
    );
  }

  return (
    <ReadonlyDocument
      doc={doc}
      copyToClipboard={copyToClipboard}
      onAddToQuery={onAddToQuery}
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
