import React, { useMemo } from 'react';
import { DocumentListView, DocumentJsonView } from '@mongodb-js/compass-crud';
import type { Document } from 'mongodb';
import HadronDocument from 'hadron-document';
import { Body, css, spacing, uiColors } from '@mongodb-js/compass-components';
import { MAX_DOCUMENTS_IN_NLP_PREVIEW } from '../hooks/use-nlp-query';

export type ResultsViewType = 'document' | 'json';

const containerStyles = css({
  ol: {
    padding: 0,
  },
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const emptyDocumentsStyles = css({
  padding: spacing[3],
  color: uiColors.gray.dark2,
});

const moreDocumentsStyles = css({
  padding: spacing[3],
});

const DocumentList: React.FunctionComponent<{
  documents: Document[];
  view: ResultsViewType;
}> = ({ documents, view }) => {
  const listProps: React.ComponentProps<typeof DocumentListView> = useMemo(
    () => ({
      docs: documents.map((doc) => new HadronDocument(doc)),
      isEditable: false,
      copyToClipboard(doc) {
        const str = doc.toEJSON();
        void navigator.clipboard.writeText(str);
      },
    }),
    [documents]
  );

  if (documents.length === 0) {
    return (
      <div className={emptyDocumentsStyles}>
        <em>No documents found :&apos;(</em>
      </div>
    );
  }

  const DocumentView =
    view === 'document' ? DocumentListView : DocumentJsonView;

  return (
    <div className={containerStyles}>
      <DocumentView {...listProps}></DocumentView>
      {documents.length >= MAX_DOCUMENTS_IN_NLP_PREVIEW && (
        <Body className={moreDocumentsStyles}>
          ^ the first <strong>{MAX_DOCUMENTS_IN_NLP_PREVIEW}</strong> documents.
        </Body>
      )}
    </div>
  );
};

export { DocumentList };
