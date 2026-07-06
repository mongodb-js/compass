import React from 'react';
import { css, DocumentList, spacing } from '@mongodb-js/compass-components';
import type HadronDocumentType from 'hadron-document';
import type { FieldTrackingProps } from './field-tracking';

const insertDocumentStyles = css({
  // We give it a good amount of spacing for dropdown menus.
  // TODO(COMPASS-6271): We'll use portals in the document editing Menu
  // so we don't need special padding here.
  paddingBottom: spacing[7],
});

type InsertDocumentProps = {
  doc: HadronDocumentType;
} & Pick<
  FieldTrackingProps,
  'trackFieldTypeChanged' | 'trackFieldAdded' | 'trackFieldRemoved'
>;

function InsertDocument({
  doc,
  trackFieldTypeChanged,
  trackFieldAdded,
  trackFieldRemoved,
}: InsertDocumentProps) {
  return (
    <div className={insertDocumentStyles} data-testid="insert-document-modal">
      <DocumentList.Document
        value={doc}
        editable
        editing
        onFieldTypeChanged={(fromType, toType) =>
          trackFieldTypeChanged?.(fromType, toType, 'insert')
        }
        onFieldAdded={(level) => trackFieldAdded?.(level, 'insert')}
        onFieldRemoved={() => trackFieldRemoved?.('insert')}
      />
    </div>
  );
}

export default InsertDocument;
