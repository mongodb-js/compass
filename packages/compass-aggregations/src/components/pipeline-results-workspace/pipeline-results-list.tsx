import React, { useCallback } from 'react';
import { DocumentListView, DocumentJsonView } from '@mongodb-js/compass-crud';
import type HadronDocument from 'hadron-document';
import { css, spacing } from '@mongodb-js/compass-components';

export type ResultsViewType = 'document' | 'json';

const containerStyles = css({
  padding: spacing[400],
});

const PipelineResultsList: React.FunctionComponent<{
  namespace: string;
  documents: HadronDocument[];
  view: ResultsViewType;
}> = ({ namespace, documents, view }) => {
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
      namespace={namespace}
      isEditable={false}
      docs={documents}
      copyToClipboard={copyToClipboard}
      className={containerStyles}
    />
  );
};

export default PipelineResultsList;
