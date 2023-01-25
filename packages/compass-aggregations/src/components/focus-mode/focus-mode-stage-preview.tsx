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
import { PipelineOutputOptionsMenu } from '../pipeline-output-options-menu';
import type { PipelineOutputOption } from '../pipeline-output-options-menu';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import { OutStagePreivew, MergeStagePreivew } from '../output-stage-preview';
import { AtlasStagePreview } from '../atlas-stage-preview';
import { isMissingAtlasStageSupport } from '../../utils/stage';

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

const loaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

type FocusModePreviewProps = {
  title: string;
  isLoading?: boolean;
  documents?: Document[] | null;
  stageIndex?: number;
  stageOperator?: string | null;
  isMissingAtlasOnlyStageSupport?: boolean;
};

export const FocusModePreview = ({
  title,
  isLoading = false,
  documents = null,
  stageIndex = -1,
  stageOperator = '',
  isMissingAtlasOnlyStageSupport = false,
}: FocusModePreviewProps) => {
  const [pipelineOutputOption, setPipelineOutputOption] =
    useState<PipelineOutputOption>('collapse');
  const isExpanded = pipelineOutputOption === 'expand';

  const docCount = documents?.length ?? 0;
  const docText = docCount === 1 ? 'document' : 'documents';
  const shouldShowCount = !isLoading && docCount > 0;

  const isPipelineOptionsMenuVisible = documents && documents.length > 0;

  let content = null;

  if (stageOperator === '$out') {
    content = (
      <div className={centerStyles}>
        <OutStagePreivew index={stageIndex} />
      </div>
    );
  } else if (stageOperator === '$merge') {
    content = (
      <div className={centerStyles}>
        <MergeStagePreivew index={stageIndex} />
      </div>
    );
  } else if (isMissingAtlasOnlyStageSupport) {
    content = (
      <div className={centerStyles}>
        <AtlasStagePreview stageOperator={stageOperator ?? ''} />
      </div>
    );
  } else if (isLoading) {
    content = (
      <div className={centerStyles}>
        <div className={loaderStyles}>
          <SpinLoader title="Loading" />
          Loading Preview Documents...
        </div>
      </div>
    );
  } else if (documents && documents.length > 0) {
    content = (
      <DocumentListView
        docs={documents}
        copyToClipboard={(doc) => {
          const str = doc.toEJSON();
          void navigator.clipboard.writeText(str);
        }}
        isEditable={false}
        isExpanded={isExpanded}
        className={documentListStyles}
      />
    );
  } else {
    content = (
      <div className={centerStyles}>
        <Body className={messageStyles}>No preview documents</Body>
      </div>
    );
  }

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
          {isPipelineOptionsMenuVisible && (
            <PipelineOutputOptionsMenu
              buttonText="Options"
              option={pipelineOutputOption}
              onChangeOption={setPipelineOutputOption}
            />
          )}
        </div>
      </div>
      {content}
    </div>
  );
};

export const InputPreview = (props: Omit<FocusModePreviewProps, 'title'>) => {
  return <FocusModePreview {...props} title="Stage Input" />;
};

export const OutputPreview = (props: Omit<FocusModePreviewProps, 'title'>) => {
  return <FocusModePreview {...props} title="Stage Output" />;
};

export const FocusModeStageInput = connect(
  ({
    focusMode: { stageIndex },
    env,
    inputDocuments,
    pipelineBuilder: {
      stageEditor: { stages },
    },
  }: RootState) => {
    if (stageIndex === -1) {
      return null;
    }

    const previousStageIndex =
      stages
        .slice(0, stageIndex)
        .map((stage, index) => ({ stage, index }))
        .filter(({ stage }) => !stage.disabled)
        .pop()?.index ?? null;

    if (previousStageIndex === null) {
      return {
        isLoading: inputDocuments.isLoading,
        documents: inputDocuments.documents,
      };
    }

    const previousStage = stages[previousStageIndex];
    return {
      isLoading: previousStage.loading,
      documents: previousStage.previewDocs,
      stageIndex: previousStageIndex,
      stageOperator: previousStage.stageOperator,
      isMissingAtlasOnlyStageSupport: isMissingAtlasStageSupport(
        env,
        previousStage.serverError
      ),
    };
  }
)(InputPreview);

export const FocusModeStageOutput = connect(
  ({
    focusMode: { stageIndex },
    env,
    pipelineBuilder: {
      stageEditor: { stages },
    },
  }: RootState) => {
    if (stageIndex === -1) {
      return null;
    }
    const stage = stages[stageIndex];
    const isMissingAtlasOnlyStageSupport = isMissingAtlasStageSupport(
      env,
      stage.serverError
    );
    return {
      isLoading: stage.loading,
      documents: stage.previewDocs,
      stageIndex,
      stageOperator: stage.stageOperator,
      isMissingAtlasOnlyStageSupport,
    };
  }
)(OutputPreview);
