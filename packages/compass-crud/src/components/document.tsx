import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import HadronDocument from 'hadron-document';
import type { EditableDocumentProps } from './editable-document';
import EditableDocument from './editable-document';
import type { ReadonlyDocumentProps } from './readonly-document';
import ReadonlyDocument from './readonly-document';
import type { BSONObject } from '../stores/crud-store';
import { hasDistinctValue } from 'mongodb-query-util';
import {
  useChangeQueryBarQuery,
  useQueryBarQuery,
} from '@mongodb-js/compass-query-bar';

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
    return new HadronDocument(_doc as Record<string, unknown>);
  }, [_doc]);

  const changeQuery = useChangeQueryBarQuery();
  const queryBarQuery = useQueryBarQuery();

  const handleAddToQuery = useCallback(
    (field: string, value: unknown) => {
      changeQuery('toggleDistinctValue', {
        field,
        value,
      });
    },
    [changeQuery]
  );

  const isInQuery = useCallback(
    (field: string, value: unknown) => {
      const filter = queryBarQuery.filter?.[field];
      return hasDistinctValue(filter, value);
    },
    [queryBarQuery]
  );

  if (editable && isTimeSeries) {
    return (
      <ReadonlyDocument
        doc={doc}
        copyToClipboard={copyToClipboard}
        openInsertDocumentDialog={(doc, cloned) => {
          void openInsertDocumentDialog?.(doc, cloned);
        }}
        onAddToQuery={handleAddToQuery}
        isInQuery={isInQuery}
      />
    );
  }

  if (editable) {
    return (
      <EditableDocument
        {...props}
        doc={doc}
        onAddToQuery={handleAddToQuery}
        isInQuery={isInQuery}
      />
    );
  }

  return (
    <ReadonlyDocument
      doc={doc}
      copyToClipboard={copyToClipboard}
      onAddToQuery={handleAddToQuery}
      isInQuery={isInQuery}
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
