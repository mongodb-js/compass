import React, { useMemo, useState } from 'react';
import {
  Body,
  css,
  SpinLoader,
  spacing,
  Overline,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';
import { DocumentListView } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';
import { PipelineOutputOptionsMenu } from './../pipeline-output-options-menu';
import type { PipelineOutputOption } from './../pipeline-output-options-menu';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  gap: spacing[2],
});

const headerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginBottom: spacing[2],
});

const centerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  textAlign: 'center',
});

const messageStyles = css({ marginTop: spacing[3] });

const documentListStyles = css({
  overflowY: 'scroll',
});

const pipelineOutputMenuStyles = css({
  marginTop: 0,
  marginRight: 0,
  marginBottom: 'auto',
  marginLeft: 'auto',
});

type StagePreviewAreaProps = {
  title: string;
  isLoading: boolean;
  documents: Document[] | null;
};

const PreviewResults = ({
  documents,
  isLoading,
  isExpanded,
}: {
  documents: Document[] | null;
  isLoading: boolean;
  isExpanded: boolean;
}) => {
  const listProps: Omit<React.ComponentProps<typeof DocumentListView>,
  'isExpanded' |
  'className'> = useMemo(
    () => ({
      docs: (documents ?? []).map((doc) => new HadronDocument(doc)),
      isEditable: false,
      copyToClipboard(doc: HadronDocument) {
        const str = doc.toEJSON();
        void navigator.clipboard.writeText(str);
      },
    }),
    [documents]
  );

  if (isLoading) {
    return (
      <div className={centerStyles}>
        <SpinLoader size="24px" />
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className={centerStyles}>
        <Body className={messageStyles}>No preview documents</Body>
      </div>
    );
  }

  return (
    <DocumentListView
      {...listProps}
      isExpanded={isExpanded}
      className={documentListStyles}
    />
  );
};

export const StagePreviewArea = ({
  title,
  isLoading,
  documents
}: StagePreviewAreaProps) => {
  const [pipelineOutputOption, setPipelineOutputOption] =
    useState<PipelineOutputOption>('collapse');
  const isExpanded = pipelineOutputOption === 'expand';

  const docCount = documents?.length ?? 0;
  const docText = docCount === 1 ? 'document' : 'documents';
  const shouldShowCount = !isLoading && docCount > 0;
  return (
    <div className={containerStyles} data-testid="focus-mode-stage-preview">
      <div className={headerStyles}>
        <div>
          <Overline>{title}</Overline>
          {shouldShowCount && (
            <Body>
              Sample of {docCount} {docText}
            </Body>
          )}
        </div>
        <div className={pipelineOutputMenuStyles}>
          <PipelineOutputOptionsMenu
            buttonText='Options'
            option={pipelineOutputOption}
            onChangeOption={setPipelineOutputOption}
          />
        </div>
      </div>
      <PreviewResults
        documents={documents}
        isLoading={isLoading}
        isExpanded={isExpanded}
      />
    </div>
  );
};