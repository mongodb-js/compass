import React, { useCallback } from 'react';
import { DocumentListView, DocumentJsonView } from '@mongodb-js/compass-crud';
import type HadronDocument from 'hadron-document';
import { css, spacing } from '@mongodb-js/compass-components';

export type ResultsViewType = 'document' | 'json';

const containerStyles = css({
  padding: spacing[3],
});

const PipelineResultsList: React.FunctionComponent<{
  documents: HadronDocument[];
  view: ResultsViewType;
}> = ({ documents, view }) => {
  const copyToClipboard = useCallback((doc: HadronDocument) => {
    const str = doc.toEJSON();
    void navigator.clipboard.writeText(str);
  }, []);

  if (documents.length === 0) {
    return null;
  }

  const DocumentView =
    view === 'document' ? DocumentListView : DocumentJsonView;

  return (
    <DocumentView
      isEditable={false}
      docs={documents}
      copyToClipboard={copyToClipboard}
      className={containerStyles}
    />
  );
};

export default PipelineResultsList;
