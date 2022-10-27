import React, { useMemo, useState } from 'react';
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
import { DocumentsDisclosureMenu } from '../../documents-disclosure-menu';
import type { DocumentsDisclosureOption } from '../../documents-disclosure-menu';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

const previewHeaderStyles = css({
  padding: spacing[3],
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
});

const centerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: spacing[3],
  textAlign: 'center',
});

const messageStyles = css({ marginTop: spacing[3] });

const documentListStyles = css({
  overflow: 'auto',
  '.document-list': {
    paddingRight: spacing[2],
  }
});

type PipelinePreviewProps = {
  isLoading: boolean;
  previewDocs: Document[] | null;
};

const PreviewResults = ({
  previewDocs,
  isLoading,
  isExpanded,
}: {
  previewDocs: Document[] | null;
  isLoading: boolean;
  isExpanded: boolean;
}) => {
  const listProps: React.ComponentProps<typeof DocumentListView> = useMemo(
    () => ({
      docs: (previewDocs ?? []).map((doc) => new HadronDocument(doc)),
      isEditable: false,
      expandAll: isExpanded,
      copyToClipboard(doc) {
        const str = doc.toEJSON();
        void navigator.clipboard.writeText(str);
      },
    }),
    [previewDocs, isExpanded]
  );

  if (isLoading) {
    return (
      <div className={centerStyles}>
        <SpinLoader size="24px" />
      </div>
    );
  }

  if (!previewDocs) {
    return (
      <div className={centerStyles}>
        <DocumentIcon />
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
        <DocumentIcon />
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

export const PipelinePreview: React.FunctionComponent<PipelinePreviewProps> = ({
  isLoading,
  previewDocs,
}) => {
  const [disclosureOption, setDisclosureOption] = useState<DocumentsDisclosureOption>('collapsed');
  const isExpanded = disclosureOption === 'expanded';

  const docCount = previewDocs?.length ?? 0;
  const docText = docCount === 1 ? 'document' : 'documents';
  const shouldShowCount = !isLoading && docCount > 0;
  return (
    <div className={containerStyles} data-testid="pipeline-as-text-preview">
      <div className={previewHeaderStyles}>
        <div>
          <Overline>Pipeline Output</Overline>
          {shouldShowCount && <Body>{`Sample of ${docCount} ${docText}`}</Body>}
        </div>
        <DocumentsDisclosureMenu onChange={setDisclosureOption} />
      </div>
      <PreviewResults isExpanded={isExpanded} isLoading={isLoading} previewDocs={previewDocs} />
    </div>
  );
};

const mapState = ({
  pipelineBuilder: {
    textEditor: { loading, previewDocs },
  },
}: RootState) => ({
  isLoading: !!loading,
  previewDocs,
});

export default connect(mapState)(PipelinePreview);
