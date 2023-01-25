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

const stagePreviewMissingSearchSupportStyles = css({
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
});

type AtlasOnlySectionProps = {
  stageOperator: string;
};

function AtlasOnlySection({ stageOperator }: AtlasOnlySectionProps) {
  return (
    <div className={stagePreviewMissingSearchSupportStyles}>
      <AtlasStagePreview stageOperator={stageOperator} />
    </div>
  );
}

const emptyStyles = css({
  paddingLeft: spacing[3],
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
    <div
      className={cx(emptyStyles, darkMode ? emptyStylesDark : emptyStylesLight)}
    >
      <Body>
        <span data-testid="stage-preview-empty">No Preview Documents</span>
      </Body>
    </div>
  );
}

const documentsStyles = css({
  margin: spacing[2],
  gap: spacing[2],
  display: 'flex',
  alignItems: 'stretch',
  width: '100%',
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
    return <AtlasOnlySection stageOperator={stageOperator} />;
  }

  // $out renders its own loader
  if (stageOperator === '$out') {
    return <OutStagePreivew index={index} />;
  }
  // $merge renders its own loader
  if (stageOperator === '$merge') {
    return <MergeStagePreivew index={index} />;
  }

  if (isLoading) {
    return <LoadingOverlay text="Loading Preview Documents..." />;
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

const stagePreviewStyles = css({
  width: '100%',
  display: 'flex',
  alignItems: 'stretch',
  overflow: 'auto',
  position: 'relative',
  flexGrow: 1,
});

// exported for tests
export function StagePreview(props: StagePreviewProps) {
  return (
    <div className={stagePreviewStyles}>
      <StagePreviewBody {...props} />
    </div>
  );
}

export default connect((state: RootState, ownProps: { index: number }) => {
  const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
  const isMissingAtlasOnlyStageSupport =
    state.env &&
    stage.serverError &&
    isMissingAtlasStageSupport(state.env, stage.serverError);

  const shouldRenderStage = Boolean(
    !stage.disabled && !stage.syntaxError && !stage.syntaxError && stage.value
  );

  return {
    isLoading: stage.loading,
    stageOperator: stage.stageOperator as string,
    shouldRenderStage,
    documents: stage.previewDocs,
    isMissingAtlasOnlyStageSupport: !!isMissingAtlasOnlyStageSupport,
  };
})(StagePreview);
