import React, { useMemo } from 'react';
import { DocumentListView, DocumentJsonView } from '@mongodb-js/compass-crud';
import type { Document } from 'mongodb';
import HadronDocument from 'hadron-document';
import { css, spacing } from '@mongodb-js/compass-components';

export type ResultsViewType = 'document' | 'json';

const containerStyles = css({
  ol: {
    padding: 0,
  },
  marginLeft: spacing[3],
  marginRight: spacing[3],
});

const PipelineResultsList: React.FunctionComponent<{
  documents: Document[];
  allDocsExpanded: boolean;
  view: ResultsViewType;
}> = ({ documents, allDocsExpanded, view }) => {
  const listProps: React.ComponentProps<typeof DocumentListView> = useMemo(
    () => ({
      docs: documents.map((doc) => new HadronDocument(doc)),
      isEditable: false,
      expandAll: allDocsExpanded,
      copyToClipboard(doc) {
        const str = doc.toEJSON();
        void navigator.clipboard.writeText(str);
      },
    }),
    [documents, allDocsExpanded]
  );

  if (documents.length === 0) {
    return null;
  }

  const DocumentView =
    view === 'document' ? DocumentListView : DocumentJsonView;

  return (
    <div className={containerStyles}>
      <DocumentView {...listProps}></DocumentView>
    </div>
  );
};

export default PipelineResultsList;
