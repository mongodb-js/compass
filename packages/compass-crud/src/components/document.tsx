import React, { useMemo } from 'react';
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
import type { QueryBarController } from '@mongodb-js/compass-components';

export type DocumentProps = {
  doc: HadronDocument | BSONObject;
  editable: boolean;
  isTimeSeries?: boolean;
} & Omit<EditableDocumentProps, 'doc' | 'expandAll'> &
  Pick<ReadonlyDocumentProps, 'copyToClipboard' | 'openInsertDocumentDialog'>;

export const Document = (props: DocumentProps) => {
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

  const queryBarChangeQuery = useChangeQueryBarQuery();
  const queryBarQuery = useQueryBarQuery();

  const queryBar = useMemo<QueryBarController>(() => {
    return {
      isInQuery: (field: string, value: unknown) => {
        const filter = queryBarQuery.filter?.[field];
        return hasDistinctValue(filter, value);
      },
      toggleQueryFilter: (field: string, value: unknown) => {
        queryBarChangeQuery('toggleDistinctValue', {
          field,
          value,
        });
      },
    };
  }, [queryBarChangeQuery, queryBarQuery]);

  if (editable && isTimeSeries) {
    return (
      <ReadonlyDocument
        doc={doc}
        copyToClipboard={copyToClipboard}
        openInsertDocumentDialog={(doc, cloned) => {
          void openInsertDocumentDialog?.(doc, cloned);
        }}
        queryBar={queryBar}
      />
    );
  }

  if (editable) {
    return <EditableDocument {...props} doc={doc} queryBar={queryBar} />;
  }

  return (
    <ReadonlyDocument
      doc={doc}
      copyToClipboard={copyToClipboard}
      queryBar={queryBar}
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
