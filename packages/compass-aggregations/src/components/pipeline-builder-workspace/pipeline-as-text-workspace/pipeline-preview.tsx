import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import {
  Body,
  css,
  SpinLoader,
  DocumentIcon,
  spacing,
  Overline,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../../modules';
import type { Document } from 'mongodb';
import { DocumentListView } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

const previewHeaderStyles = css({
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
  paddingLeft: spacing[3],
});

const centerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
});

const messageStyles = css({ marginTop: spacing[3] });

const documentListStyles = css({
  overflow: 'scroll',
});

type PipelineAsTextWorkspaceProps = {
  loading: boolean;
  previewDocs: Document[] | null;
  sampleSize: number;
};

const PreviewHeader = ({ sampleSize }: { sampleSize: number }) => {
  return (
    <div className={previewHeaderStyles}>
      <Overline>Pipeline Output</Overline>
      <Body>{`Sample of ${sampleSize} documents`}</Body>
    </div>
  );
};

const PreviewResults = ({
  previewDocs,
  loading,
}: {
  previewDocs: Document[] | null;
  loading: boolean;
}) => {
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

  if (loading) {
    return (
      <div className={centerStyles}>
        <SpinLoader size="24px" />
      </div>
    );
  }

  if (!previewDocs) {
    return (
      <div className={centerStyles}>
        <DocumentIcon size={spacing[6]} />
        <Body className={messageStyles}>
          Preview results to see a sample of the aggregated results from this
          pipeline.
        </Body>
      </div>
    );
  }

  if (previewDocs.length === 0) {
    return (
      <div className={centerStyles}>
        <DocumentIcon size={spacing[6]} />
        <Body className={messageStyles}>No preview documents</Body>
      </div>
    );
  }

  return (
    <div className={documentListStyles}>
      <DocumentListView {...listProps} />
    </div>
  );
};

export const PipelineAsTextWorkspace: React.FunctionComponent<
  PipelineAsTextWorkspaceProps
> = ({ loading, previewDocs, sampleSize }) => {
  return (
    <div className={containerStyles}>
      <PreviewHeader sampleSize={sampleSize} />
      <PreviewResults loading={loading} previewDocs={previewDocs} />
    </div>
  );
};

const mapState = ({
  pipelineBuilder: {
    textEditor: { loading, previewDocs },
  },
  settings: { sampleSize },
}: RootState) => ({
  loading,
  previewDocs,
  sampleSize,
});

export default connect(mapState)(PipelineAsTextWorkspace);
