import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Body,
  css,
  SpinLoader,
  DocumentIcon,
  spacing,
  Overline,
  WarningSummary,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../../modules';
import { DocumentListView } from '@mongodb-js/compass-crud';
import type HadronDocument from 'hadron-document';
import { PipelineOutputOptionsMenu } from '../../pipeline-output-options-menu';
import type { PipelineOutputOption } from '../../pipeline-output-options-menu';
import { getPipelineStageOperatorsFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';
import { OutputStageBanner } from './pipeline-stages-preview';
import { AtlasStagePreview } from '../../stage-preview/atlas-stage-preview';
import {
  isMissingAtlasStageSupport,
  findAtlasOperator,
} from '../../../utils/stage';
import {
  expandPreviewDocs,
  collapsePreviewDocs,
} from '../../../modules/pipeline-builder/text-editor-pipeline';
import SearchNoResults from '../../search-no-results';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: spacing[400],
  paddingBottom: spacing[200],
  gap: spacing[200],
});

const previewHeaderStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
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
  overflow: 'auto',
});

const pipelineOutputMenuStyles = css({
  marginTop: 0,
  marginRight: 0,
  marginBottom: 'auto',
  marginLeft: 'auto',
});

const outputStageStyles = css({
  marginTop: 'auto',
});

type PipelinePreviewProps = {
  isLoading: boolean;
  isMergeStage: boolean;
  isOutStage: boolean;
  isMissingAtlasSupport: boolean;
  atlasOperator: string;
  previewDocs: HadronDocument[] | null;
  isPreviewStale: boolean;
  onExpand: () => void;
  onCollapse: () => void;
};

const PreviewResults = ({
  previewDocs,
  isLoading,
  isMissingAtlasSupport,
  atlasOperator,
  isPreviewStale,
}: {
  previewDocs: HadronDocument[] | null;
  isLoading: boolean;
  isMissingAtlasSupport: boolean;
  atlasOperator: string;
  isPreviewStale: boolean;
}) => {
  const copyToClipboard = useCallback((doc: HadronDocument) => {
    const str = doc.toEJSON();
    void navigator.clipboard.writeText(str);
  }, []);

  if (isLoading) {
    return (
      <div className={centerStyles}>
        <SpinLoader size="24px" />
      </div>
    );
  }

  if (isMissingAtlasSupport) {
    return (
      <div className={centerStyles}>
        <AtlasStagePreview stageOperator={atlasOperator} />
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
    if (atlasOperator) {
      return <SearchNoResults />;
    }
    return (
      <div className={centerStyles}>
        <DocumentIcon />
        <Body className={messageStyles}>No preview documents</Body>
      </div>
    );
  }

  return (
    <>
      {isPreviewStale && (
        <WarningSummary warnings={['Output outdated and no longer in sync.']} />
      )}
      <DocumentListView
        docs={previewDocs}
        copyToClipboard={copyToClipboard}
        isEditable={false}
        className={documentListStyles}
      />
    </>
  );
};

export const PipelinePreview: React.FunctionComponent<PipelinePreviewProps> = ({
  isLoading,
  isMergeStage,
  isOutStage,
  isMissingAtlasSupport,
  previewDocs,
  atlasOperator,
  isPreviewStale,
  onExpand,
  onCollapse,
}) => {
  const docCount = previewDocs?.length ?? 0;
  const docText = docCount === 1 ? 'document' : 'documents';
  const shouldShowCount = !isLoading && docCount > 0;
  const stageOperator = isMergeStage ? '$merge' : isOutStage ? '$out' : null;

  const handlePipelineOutputOptionChanged = useCallback(
    (option: PipelineOutputOption) => {
      if (option === 'expand') {
        onExpand();
      } else if (option === 'collapse') {
        onCollapse();
      }
    },
    [onExpand, onCollapse]
  );

  return (
    <div className={containerStyles} data-testid="pipeline-as-text-preview">
      <div className={previewHeaderStyles}>
        <div>
          <Overline>Pipeline Output</Overline>
          {shouldShowCount && (
            <Body>
              Sample of {docCount} {docText}
            </Body>
          )}
        </div>
        <div className={pipelineOutputMenuStyles}>
          <PipelineOutputOptionsMenu
            onChangeOption={handlePipelineOutputOptionChanged}
          />
        </div>
      </div>
      <PreviewResults
        isLoading={isLoading}
        isMissingAtlasSupport={isMissingAtlasSupport}
        atlasOperator={atlasOperator}
        previewDocs={previewDocs}
        isPreviewStale={isPreviewStale}
      />
      <div className={outputStageStyles} data-testid="output-stage-preview">
        <OutputStageBanner stageOperator={stageOperator} />
      </div>
    </div>
  );
};

const mapState = (state: RootState) => {
  const stageOperators = getPipelineStageOperatorsFromBuilderState(state);
  const lastStage = stageOperators[stageOperators.length - 1] ?? '';
  const { isLoading, previewDocs, serverError, isPreviewStale } =
    state.pipelineBuilder.textEditor.pipeline;
  const atlasOperator = findAtlasOperator(stageOperators) ?? '';
  const isMissingAtlasSupport = isMissingAtlasStageSupport(
    state.env,
    atlasOperator,
    serverError
  );
  return {
    isLoading,
    previewDocs,
    isMergeStage: lastStage === '$merge',
    isOutStage: lastStage === '$out',
    isMissingAtlasSupport,
    atlasOperator,
    isPreviewStale,
  };
};

export default connect(mapState, {
  onExpand: expandPreviewDocs,
  onCollapse: collapsePreviewDocs,
})(PipelinePreview);
