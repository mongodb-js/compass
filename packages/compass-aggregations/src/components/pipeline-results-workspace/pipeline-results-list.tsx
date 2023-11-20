import React, { useEffect, useMemo } from 'react';
import { DocumentListView, DocumentJsonView } from '@mongodb-js/compass-crud';
import type { Document } from 'mongodb';
import HadronDocument from 'hadron-document';
import { css, spacing } from '@mongodb-js/compass-components';

export type ResultsViewType = 'document' | 'json';

const containerStyles = css({
  padding: spacing[3],
});

const PipelineResultsList: React.FunctionComponent<{
  documents: Document[];
  allDocsExpanded?: boolean;
  view: ResultsViewType;
}> = ({ documents, allDocsExpanded, view }) => {
  const { docs, copyToClipboard } = useMemo(() => {
    return {
      docs: documents.map((doc) => new HadronDocument(doc)),
      isEditable: false,
      copyToClipboard: (doc: HadronDocument) => {
        const str = doc.toEJSON();
        void navigator.clipboard.writeText(str);
      },
    };
  }, [documents]);

  useEffect(() => {
    if (allDocsExpanded) {
      docs.forEach((doc) => doc.expandAllFields());
    } else {
      docs.forEach((doc) => doc.collapseAllFields());
    }
  }, [allDocsExpanded, docs]);

  if (documents.length === 0) {
    return null;
  }

  const DocumentView =
    view === 'document' ? DocumentListView : DocumentJsonView;

  return (
    <DocumentView
      isEditable={false}
      docs={docs}
      copyToClipboard={copyToClipboard}
      className={containerStyles}
    />
  );
};

export default PipelineResultsList;
