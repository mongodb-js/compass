import React from 'react';
import { connect } from 'react-redux';
import type { Document as DocumentType } from 'mongodb';
import {
  css,
  cx,
  spacing,
  palette,
  Body,
  KeylineCard,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';

import type { RootState } from '../../modules';
import { isMissingAtlasStageSupport } from '../../utils/stage';

import LoadingOverlay from '../loading-overlay';
import { AtlasStagePreview } from './atlas-stage-preview';
import { OutStagePreivew, MergeStagePreivew } from './output-stage-preview';
import StagePreviewHeader from './stage-preview-header';

const centeredContent = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: spacing[3],
});

const emptyStyles = css({
  margin: 'auto',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fill: 'none',
  textAlign: 'center',
});

const emptyStylesDark = css({
  stroke: palette.gray.base,
});

const emptyStylesLight = css({
  stroke: palette.gray.base,
});

function EmptyIcon() {
  const darkMode = useDarkMode();

  return (
    <div className={centeredContent}>
      <div
        className={cx(
          emptyStyles,
          darkMode ? emptyStylesDark : emptyStylesLight
        )}
      >
        <Body>
          <span data-testid="stage-preview-empty">No Preview Documents</span>
        </Body>
      </div>
    </div>
  );
}

const documentsStyles = css({
  gap: spacing[2],
  display: 'flex',
  alignItems: 'stretch',
  width: '100%',
  height: '100%',
  overflowX: 'auto',
});

const documentContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 'none',
  flexShrink: 0,
  width: '384px',
  marginBottom: spacing[2],
});

const documentStyles = css({
  flexBasis: '164px',
  flexGrow: 1,
  flexShrink: 0,
  overflow: 'auto',
  padding: 0,
});

type StagePreviewProps = {
  index: number;
  isLoading: boolean;
  isDisabled: boolean;
  isMissingAtlasOnlyStageSupport: boolean;
  stageOperator: string;
  documents: DocumentType[] | null;
  shouldRenderStage: boolean;
};

function StagePreviewBody({
  index,
  stageOperator,
  documents,
  isMissingAtlasOnlyStageSupport,
  shouldRenderStage,
  isLoading,
}: StagePreviewProps) {
  if (!shouldRenderStage) {
    return <EmptyIcon />;
  }

  if (isMissingAtlasOnlyStageSupport) {
    return (
      <div className={centeredContent}>
        <AtlasStagePreview stageOperator={stageOperator} />
      </div>
    );
  }

  // $out renders its own loader
  if (stageOperator === '$out') {
    return (
      <div className={centeredContent}>
        <OutStagePreivew index={index} />
      </div>
    );
  }
  // $merge renders its own loader
  if (stageOperator === '$merge') {
    return (
      <div className={centeredContent}>
        <MergeStagePreivew index={index} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={centeredContent}>
        <LoadingOverlay text="Loading Preview Documents..." />
      </div>
    );
  }

  if (documents && documents.length > 0) {
    const docs = documents.map((doc, i) => {
      return (
        <KeylineCard key={i} className={documentContainerStyles}>
          <div className={documentStyles}>
            <Document doc={doc} editable={false} />
          </div>
        </KeylineCard>
      );
    });
    return <div className={documentsStyles}>{docs}</div>;
  }

  return <EmptyIcon />;
}

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[3],
  gap: spacing[2],
  flex: 1,
});

const stagePreviewStyles = css({
  alignItems: 'stretch',
  position: 'relative',
  flexGrow: 1,
});

// exported for tests
export function StagePreview(props: StagePreviewProps) {
  if (props.isDisabled) {
    return (
      <div className={containerStyles}>
        <EmptyIcon />
      </div>
    );
  }
  return (
    <div className={containerStyles}>
      <StagePreviewHeader index={props.index} />
      <div className={stagePreviewStyles}>
        <StagePreviewBody {...props} />
      </div>
    </div>
  );
}

export default connect((state: RootState, ownProps: { index: number }) => {
  const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
  const isMissingAtlasOnlyStageSupport = isMissingAtlasStageSupport(
    state.env,
    stage.stageOperator,
    stage.serverError
  );

  const shouldRenderStage = Boolean(
    !stage.disabled && !stage.syntaxError && !stage.syntaxError && stage.value
  );

  return {
    isLoading: stage.loading,
    isDisabled: stage.disabled,
    stageOperator: stage.stageOperator as string,
    shouldRenderStage,
    documents: stage.previewDocs,
    isMissingAtlasOnlyStageSupport: !!isMissingAtlasOnlyStageSupport,
  };
})(StagePreview);
