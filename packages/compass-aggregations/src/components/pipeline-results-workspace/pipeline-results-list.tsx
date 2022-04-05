import React, { useMemo } from 'react';
import { DocumentListView, DocumentJsonView } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';
import { EJSON } from 'bson';
import { css } from '@mongodb-js/compass-components';

export type ResultsViewType = 'document' | 'json';

const containerStyles = css({
  ol: {
    padding: 0,
  },
});

export const PipelineResultsList: React.FunctionComponent<{
  documents: unknown[];
  view: ResultsViewType;
}> = ({ documents, view }) => {
  const listProps: React.ComponentProps<typeof DocumentListView> = useMemo(
    () => ({
      docs: documents.map((doc) => new HadronDocument(doc)),
      isEditable: false,
      copyToClipboard(doc) {
        const obj = doc.generateObject();
        const str = EJSON.stringify(
          obj as EJSON.SerializableTypes,
          undefined,
          2
        );
        void navigator.clipboard.writeText(str);
      },
    }),
    [documents]
  );

  const DocumentView =
    view === 'document' ? DocumentListView : DocumentJsonView;

  return (
    <div className={containerStyles}>
      <DocumentView {...listProps}></DocumentView>
    </div>
  );
};

export default PipelineResultsList;
