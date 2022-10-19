import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { css, spacing, palette } from '@mongodb-js/compass-components';
import type { RootState } from '../../../modules';
import type { Document } from 'mongodb';
import { DocumentListView } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';

import PipelineTextEditor from './text-editor';

const containerStyles = css({
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[2],
  marginBottom: spacing[3],
  marginLeft: spacing[3],
  marginRight: spacing[3],

  border: `1px solid ${palette.gray.light2}`,
  borderRadius: '4px',
  boxShadow: `1px 1px 1px ${palette.gray.light2}`,
});

const editorStyles = css({
  flex: 1,
  overflow: 'hidden',
  borderRight: `2px solid ${palette.gray.light2}`,
});

const resultsStyles = css({
  flex: 1,
  overflow: 'scroll',
});

type PipelineAsTextWorkspaceProps = {
  loading: boolean;
  previewDocs: Document[] | null;
};

export const PipelineAsTextWorkspace: React.FunctionComponent<
  PipelineAsTextWorkspaceProps
> = ({ loading, previewDocs }) => {
  const listProps: React.ComponentProps<typeof DocumentListView> = useMemo(
    () => ({
      docs: (previewDocs ?? []).map((doc) => new HadronDocument(doc)),
      isEditable: false,
      copyToClipboard(doc) {
        const str = doc.toEJSON();
        void navigator.clipboard.writeText(str);
      },
    }),
    [previewDocs]
  );

  return (
    <div data-testid="pipeline-as-text-workspace" className={containerStyles}>
      <div className={editorStyles}>
        <PipelineTextEditor />
      </div>
      <div className={resultsStyles}>
        {loading ? <>loading ...</> : <DocumentListView {...listProps} />}
      </div>
    </div>
  );
};

const mapState = ({
  pipelineBuilder: {
    textEditor: { loading, previewDocs },
  },
}: RootState) => ({
  loading,
  previewDocs,
});

export default connect(mapState)(PipelineAsTextWorkspace);
