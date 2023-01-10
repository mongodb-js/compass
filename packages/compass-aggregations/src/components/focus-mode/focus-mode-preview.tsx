import React, { useState } from 'react';
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
import { PipelineOutputOptionsMenu } from '../pipeline-output-options-menu';
import type { PipelineOutputOption } from '../pipeline-output-options-menu';

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

type FocusModePreviewProps = {
  title: string;
  isLoading?: boolean;
  documents?: Document[] | null;
};

export const FocusModePreview = ({
  title,
  isLoading,
  documents
}: FocusModePreviewProps) => {
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
      {isLoading ? (
        <div className={centerStyles}>
          <SpinLoader size="24px" />
        </div>
      ) : (!documents || documents.length === 0) ? (
        <div className={centerStyles}>
          <Body className={messageStyles}>No preview documents</Body>
        </div>
      ) : (
        <DocumentListView
          docs={(documents ?? []).map((doc) => new HadronDocument(doc))}
          copyToClipboard = {(doc: HadronDocument) => {
            const str = doc.toEJSON();
            void navigator.clipboard.writeText(str);
          }}
          isEditable={false}
          isExpanded={isExpanded}
          className={documentListStyles}
        />
      )}
    </div>
  );
};