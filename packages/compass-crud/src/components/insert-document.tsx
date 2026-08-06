import React, { useMemo } from 'react';
import { css, DocumentList, spacing } from '@mongodb-js/compass-components';
import type HadronDocumentType from 'hadron-document';
import { useDocumentEditsTelemetry } from '../hooks/use-document-edits-telemetry';

const insertDocumentStyles = css({
  // We give it a good amount of spacing for dropdown menus.
  // TODO(COMPASS-6271): We'll use portals in the document editing Menu
  // so we don't need special padding here.
  paddingBottom: spacing[7],
});

type InsertDocumentProps = {
  doc: HadronDocumentType;
};

function InsertDocument({ doc }: InsertDocumentProps) {
  useDocumentEditsTelemetry(
    useMemo(() => [doc], [doc]),
    'insert'
  );

  return (
    <div className={insertDocumentStyles} data-testid="insert-document-modal">
      <DocumentList.Document value={doc} editable editing />
    </div>
  );
}

export default InsertDocument;
