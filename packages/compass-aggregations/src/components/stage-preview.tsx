import React from 'react';
import { connect } from 'react-redux';
import type { Document as DocumentType  } from 'mongodb';
import { css, cx, spacing, palette, Body, KeylineCard, useDarkMode } from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';

import type { RootState } from '../modules';
import { isMissingAtlasStageSupport } from '../utils/stage';

import LoadingOverlay from './loading-overlay';
import { AtlasStagePreview } from './atlas-stage-preview';
import { OutStagePreivew, MergeStagePreivew } from './output-stage-preview';

const stagePreviewMissingSearchSupportStyles = css({
  display: 'flex',
  flex: 1,
  justifyContent: 'center'
});

type AtlasOnlySectionProps = {
  stageOperator: string
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
  textAlign: 'center'
});

const emptyStylesDark = css({
  stroke: palette.gray.base
});

const emptyStylesLight = css({
  stroke: palette.gray.base
});

function EmptyIcon() {
  const darkMode = useDarkMode();

  return (<div className={cx(emptyStyles, darkMode ? emptyStylesDark : emptyStylesLight)}>
    <Body>
      <span data-testid="stage-preview-empty">No Preview Documents</span>
    </Body>
  </div>);
}

const documentsStyles = css({
  margin: spacing[2],
  gap: spacing[2],
  display: 'flex',
  alignItems: 'stretch',
  width: '100%',
  overflowX: 'auto'
});

const documentContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 'none',
  flexShrink: 0,
  width: '384px',
  marginBottom: spacing[2]
});

const documentStyles = css({
  flexBasis: '164px',
  flexGrow: 1,
  flexShrink: 0,
  overflow: 'auto',
  padding: 0,
});


type StagePreviewProps = {
  index: number,
  stageOperator: string,
  stageValue: string | null,
  isEnabled: boolean,
  isValid: boolean,
  isLoading: boolean,
  documents: DocumentType[] | null;
  isComplete: boolean,
  hasServerError: boolean,
  isAtlasDeployed: boolean,
  isMissingAtlasOnlyStageSupport: boolean
};

function StagePreviewBody({
  index,
  stageOperator,
  stageValue,
  isEnabled,
  isValid,
  isLoading,
  documents,
  isMissingAtlasOnlyStageSupport
}: StagePreviewProps) {
  if (isMissingAtlasOnlyStageSupport) {
    return <AtlasOnlySection stageOperator={stageOperator} />;
  }

  if (isValid && isEnabled && stageValue) {
    if (stageOperator === '$out') {
      return <OutStagePreivew index={index}/>
    }

    if (stageOperator === '$merge') {
      return <MergeStagePreivew index={index} />
    }

    if (documents && documents.length > 0) {
      const docs = documents.map((doc, i) => {
        return (
          <KeylineCard key={i} className={documentContainerStyles}>
            <div className={documentStyles}>
              <Document doc={doc} editable={false}  />
            </div>
          </KeylineCard>
        );
      });
      return (
        <div className={documentsStyles}>
          {docs}
        </div>
      );
    }
  }

  if (isLoading) {
    // Don't render the empty state when loading.
    return null;
  }

  return (
    <EmptyIcon />
  );
}

function LoadingIndicator({ stageOperator }: { stageOperator: string}) {
    if (['$out', '$merge'].includes(stageOperator)) {
      return (<LoadingOverlay text="Persisting Documents..." />);
    }
    return (<LoadingOverlay text="Loading Preview Documents..." />);
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
  const { isLoading, stageOperator } = props;
  return (
    <div className={stagePreviewStyles}>
      {isLoading && stageOperator && <LoadingIndicator stageOperator={stageOperator} />}
      <StagePreviewBody {...props} />
    </div>
  );
}

export default connect(
  (state: RootState, ownProps: { index: number }) => {
    const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
    const isComplete =
      Boolean(!stage.loading && !stage.serverError && stage.previewDocs);
    const isMissingAtlasOnlyStageSupport = state.env && stage.serverError && isMissingAtlasStageSupport(
      state.env,
      stage.serverError
    );

    return {
      stageOperator: stage.stageOperator as string,
      stageValue: stage.value,
      isEnabled: !stage.disabled,
      isValid: !stage.serverError && !stage.syntaxError,
      isLoading: stage.loading,
      documents: stage.previewDocs,
      hasServerError: !!stage.serverError,
      isAtlasDeployed: state.isAtlasDeployed,
      isComplete,
      isMissingAtlasOnlyStageSupport: !!isMissingAtlasOnlyStageSupport,
    };
  })(StagePreview);
