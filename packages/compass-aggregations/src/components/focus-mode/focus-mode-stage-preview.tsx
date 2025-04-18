import React, { useCallback } from 'react';
import {
  Body,
  css,
  SpinLoader,
  spacing,
  Overline,
} from '@mongodb-js/compass-components';
import type HadronDocument from 'hadron-document';
import { DocumentListView } from '@mongodb-js/compass-crud';
import { PipelineOutputOptionsMenu } from '../pipeline-output-options-menu';
import type { PipelineOutputOption } from '../pipeline-output-options-menu';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import OutputStagePreview from '../stage-preview/output-stage-preview';
import { AtlasStagePreview } from '../stage-preview/atlas-stage-preview';
import {
  isAtlasOnlyStage,
  isSearchStage,
  isMissingAtlasStageSupport,
  isOutputStage,
} from '../../utils/stage';
import {
  collapsePreviewDocsForStage,
  expandPreviewDocsForStage,
} from '../../modules/pipeline-builder/stage-editor';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';
import SearchNoResults from '../search-no-results';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  gap: spacing[200],
});

const headerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginBottom: spacing[200],
  flexWrap: 'wrap',
});

const titleStyles = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const centerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  textAlign: 'center',
});

const messageStyles = css({ marginTop: spacing[400] });

const documentListStyles = css({
  overflowY: 'auto',
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
  gap: spacing[200],
});

type FocusModePreviewProps = {
  title: string;
  isLoading?: boolean;
  documents?: HadronDocument[] | null;
  stageIndex?: number;
  stageOperator?: string | null;
  isMissingAtlasOnlyStageSupport?: boolean;
  onExpand: (stageIdx: number) => void;
  onCollapse: (stageIdx: number) => void;
};

export const FocusModePreview = ({
  title,
  isLoading = false,
  documents = null,
  stageIndex = -1,
  stageOperator = '',
  isMissingAtlasOnlyStageSupport = false,
  onExpand,
  onCollapse,
}: FocusModePreviewProps) => {
  const copyToClipboard = useCallback((doc: HadronDocument) => {
    const str = doc.toEJSON();
    void navigator.clipboard.writeText(str);
  }, []);

  const handlePipelineOutputOptionChanged = useCallback(
    (option: PipelineOutputOption) => {
      if (option === 'expand') {
        onExpand(stageIndex);
      } else if (option === 'collapse') {
        onCollapse(stageIndex);
      }
    },
    [onExpand, onCollapse, stageIndex]
  );

  const docCount = documents?.length ?? 0;
  const docText = docCount === 1 ? 'document' : 'documents';
  const shouldShowCount = !isLoading && docCount > 0;

  const isPipelineOptionsMenuVisible = documents && documents.length > 0;

  let content = null;

  if (isOutputStage(stageOperator ?? '')) {
    content = (
      <div className={centerStyles}>
        <OutputStagePreview index={stageIndex} />
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
        isEditable={false}
        docs={documents ?? []}
        copyToClipboard={copyToClipboard}
        className={documentListStyles}
      />
    );
  } else if (isSearchStage(stageOperator)) {
    content = <SearchNoResults />;
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
        <div className={titleStyles}>
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
              onChangeOption={handlePipelineOutputOptionChanged}
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
      return {};
    }

    const previousStageIndex =
      stages
        .slice(0, stageIndex)
        .map((stage, index) => ({ stage, index }))
        .filter(({ stage }) => stage.type === 'stage' && !stage.disabled)
        .pop()?.index ?? null;

    if (previousStageIndex === null) {
      return {
        isLoading: inputDocuments.isLoading,
        documents: inputDocuments.documents,
      };
    }

    const previousStage = stages[previousStageIndex] as StoreStage;

    const isMissingAtlasOnlyStageSupport = isMissingAtlasStageSupport(
      env,
      previousStage.stageOperator,
      previousStage.serverError
    );

    // If previous stage is an output stage or an atlas only stage
    // with missing atlas support, we don't show its corresponding
    // input preview. Instead we show `No Preivew Documents` message.
    if (
      isOutputStage(previousStage.stageOperator || '') ||
      (isAtlasOnlyStage(previousStage.stageOperator || '') &&
        isMissingAtlasOnlyStageSupport)
    ) {
      return {};
    }

    return {
      isLoading: previousStage.loading,
      documents: previousStage.previewDocs,
      stageIndex: previousStageIndex,
      stageOperator: previousStage.stageOperator,
      isMissingAtlasOnlyStageSupport,
    };
  },
  {
    onExpand: expandPreviewDocsForStage,
    onCollapse: collapsePreviewDocsForStage,
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
      return {};
    }
    const stage = stages[stageIndex] as StoreStage;

    const isMissingAtlasOnlyStageSupport = isMissingAtlasStageSupport(
      env,
      stage.stageOperator,
      stage.serverError
    );
    return {
      isLoading: stage.loading,
      documents: stage.previewDocs,
      stageIndex,
      stageOperator: stage.stageOperator,
      isMissingAtlasOnlyStageSupport,
    };
  },
  {
    onExpand: expandPreviewDocsForStage,
    onCollapse: collapsePreviewDocsForStage,
  }
)(OutputPreview);
