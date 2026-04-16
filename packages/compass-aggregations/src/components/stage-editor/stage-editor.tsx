import React, { useCallback, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import type { MongoServerError } from 'mongodb';
import {
  CodemirrorMultilineEditor,
  createStageAutocompleter,
} from '@mongodb-js/compass-editor';
import type { Annotation, EditorRef } from '@mongodb-js/compass-editor';
import {
  css,
  cx,
  spacing,
  palette,
  Banner,
  Link,
  useDarkMode,
  useRequiredURLSearchParams,
  useCurrentValueRef,
} from '@mongodb-js/compass-components';
import {
  changeStageValue,
  getIndexOfFirstStageWithServerError,
  pipelineFromStore,
} from '../../modules/pipeline-builder/stage-editor';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';
import { mapPipelineModeToEditorViewType } from '../../modules/pipeline-builder/builder-helpers';
import type { RootState } from '../../modules';
import type { PipelineParserError } from '../../modules/pipeline-builder/pipeline-parser/utils';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import {
  openCreateSearchIndexDrawerView,
  openEditSearchIndexDrawerView,
  openIndexesListDrawerView,
} from '../../modules/search-indexes';
import type { SearchIndexType } from '../../modules/search-indexes';
import { usePreference } from 'compass-preferences-model/provider';
import {
  getSearchIndexNameFromSearchStage,
  isSearchStage,
} from '../../utils/stage';
import ServerErrorBanner from '../server-error-banner';
import SearchIndexDoesNotExistBanner from '../search-index-does-not-exist-banner';

const editorContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  overflow: 'hidden',
  height: '100%',
});

const editorContainerStylesDark = css({});

const editorContainerStylesLight = css({
  background: palette.gray.light3,
});

const codeEditorContainerStyles = css({
  flex: 1,
  flexShrink: 0,
  margin: 0,
  width: '100%',
  minHeight: '230px',
});

// We use custom color here so need to disable default one that we use
// everywhere else
const codeEditorStyles = css({
  '& .cm-editor': {
    background: 'transparent !important',
  },
});

const bannerStyles = css({
  flex: 'none',
  marginTop: spacing[200],
  marginLeft: spacing[200],
  marginRight: spacing[200],
  textAlign: 'left',
});

type StageEditorProps = {
  index: number;
  namespace: string;
  stageOperator: string | null;
  stageValue: string | null;
  serverVersion: string;
  syntaxError: PipelineParserError | null;
  serverError: MongoServerError | null;
  serverErrorStageIdx: number | null;
  num_stages: number;
  editor_view_type: 'text' | 'stage' | 'focus';
  searchIndexName: string | null;
  showSearchIndexDoesNotExistBanner: boolean;
  className?: string;
  onChange: (index: number, value: string) => void;
  onViewSearchIndexesClick: () => void;
  onCreateSearchIndexClick: (searchIndexType: SearchIndexType) => void;
  onEditSearchIndexClick: (indexName: string) => void;
  editorRef?: React.Ref<EditorRef>;
};

export const StageEditor = ({
  namespace,
  stageValue,
  stageOperator,
  index,
  onChange,
  onViewSearchIndexesClick,
  onCreateSearchIndexClick,
  onEditSearchIndexClick,
  serverError,
  serverErrorStageIdx,
  syntaxError,
  className,
  serverVersion,
  num_stages,
  editor_view_type,
  searchIndexName,
  showSearchIndexDoesNotExistBanner,
  editorRef,
}: StageEditorProps) => {
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();
  const darkMode = useDarkMode();
  const editorInitialValueRef = useRef<string | null>(stageValue);
  const editorCurrentValueRef = useCurrentValueRef<string | null>(stageValue);

  const fields = useAutocompleteFields(namespace);

  const enableSearchActivationProgramP1 = usePreference(
    'enableSearchActivationProgramP1'
  );

  const { utmSource, utmMedium } = useRequiredURLSearchParams();

  const completer = useMemo(() => {
    return createStageAutocompleter({
      serverVersion,
      stageOperator: stageOperator ?? undefined,
      fields,
      utmSource,
      utmMedium,
    });
  }, [fields, serverVersion, stageOperator, utmSource, utmMedium]);

  const annotations = useMemo<Annotation[]>(() => {
    if (syntaxError?.loc?.index) {
      return [
        {
          message: syntaxError.message,
          severity: 'error',
          from: syntaxError.loc.index,
          to: syntaxError.loc.index,
        },
      ];
    }

    return [];
  }, [syntaxError]);

  const onBlurEditor = useCallback(() => {
    if (
      !!editorCurrentValueRef.current &&
      editorCurrentValueRef.current !== editorInitialValueRef.current
    ) {
      track(
        'Aggregation Edited',
        {
          num_stages: num_stages,
          stage_index: index + 1,
          stage_action: 'stage_content_changed',
          stage_name: stageOperator,
          editor_view_type: editor_view_type,
        },
        connectionInfoRef.current
      );
      editorInitialValueRef.current = editorCurrentValueRef.current;
    }
  }, [
    editorCurrentValueRef,
    track,
    num_stages,
    index,
    stageOperator,
    editor_view_type,
    connectionInfoRef,
  ]);

  const onClickStageWithError = useCallback(() => {
    document
      .querySelector(`[data-stage-index="${serverErrorStageIdx}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [serverErrorStageIdx]);

  const isServerErrorUpstream =
    serverErrorStageIdx !== null && serverErrorStageIdx < index;

  return (
    <div
      data-testid="stage-editor"
      className={cx(
        editorContainerStyles,
        darkMode ? editorContainerStylesDark : editorContainerStylesLight,
        className
      )}
    >
      <div className={codeEditorContainerStyles}>
        <CodemirrorMultilineEditor
          ref={editorRef}
          text={stageValue ?? ''}
          onChangeText={(value: string) => {
            onChange(index, value);
          }}
          className={codeEditorStyles}
          id={`aggregations-stage-editor-${index}`}
          completer={completer}
          annotations={annotations}
          onBlur={onBlurEditor}
        />
      </div>
      {syntaxError && (
        <Banner
          variant="warning"
          data-testid="stage-editor-syntax-error"
          title={syntaxError.message}
          className={bannerStyles}
        >
          {!stageOperator
            ? 'Stage operator is required'
            : !stageValue
            ? 'Stage value can not be empty'
            : syntaxError.message}
        </Banner>
      )}
      {serverError && !isServerErrorUpstream && (
        <div className={bannerStyles}>
          <ServerErrorBanner
            message={serverError.message}
            searchIndexName={searchIndexName}
            dataTestId="stage-editor-error-message"
            // Don't show link when in focus mode as modal covers the drawer
            onEditSearchIndexClick={
              editor_view_type !== 'focus' ? onEditSearchIndexClick : undefined
            }
          />
        </div>
      )}
      {isServerErrorUpstream && (
        <Banner
          variant="warning"
          data-testid="stage-editor-upstream-error-message"
          className={bannerStyles}
        >
          An error occurred on{' '}
          <Link as="button" onClick={onClickStageWithError}>
            Stage {serverErrorStageIdx + 1}
          </Link>
          .
        </Banner>
      )}
      {enableSearchActivationProgramP1 &&
        !serverError &&
        !syntaxError &&
        showSearchIndexDoesNotExistBanner &&
        isSearchStage(stageOperator) && (
          <SearchIndexDoesNotExistBanner
            searchIndexName={searchIndexName}
            searchStageOperator={stageOperator}
            // Don't show links when in focus mode as modal covers the drawer
            onViewIndexesClick={
              editor_view_type !== 'focus'
                ? onViewSearchIndexesClick
                : undefined
            }
            onCreateSearchIndexClick={
              editor_view_type !== 'focus'
                ? onCreateSearchIndexClick
                : undefined
            }
          />
        )}
    </div>
  );
};

export default connect(
  (state: RootState, ownProps: { index: number }) => {
    const stages = state.pipelineBuilder.stageEditor.stages;
    const stage = stages[ownProps.index] as StoreStage;
    const num_stages = pipelineFromStore(stages).length;
    const editor_view_type = mapPipelineModeToEditorViewType(state);
    const searchIndexName = getSearchIndexNameFromSearchStage(
      stage.stageOperator,
      stage.value
    );
    const showSearchIndexDoesNotExistBanner =
      !!searchIndexName &&
      ['READY', 'POLLING'].includes(state.searchIndexes.status) &&
      state.searchIndexes.indexes.every((x) => x.name !== searchIndexName);

    return {
      namespace: state.namespace,
      stageValue: stage.value,
      stageOperator: stage.stageOperator,
      syntaxError: !stage.empty ? stage.syntaxError ?? null : null,
      serverError: !stage.empty ? stage.serverError ?? null : null,
      serverErrorStageIdx: getIndexOfFirstStageWithServerError(
        stages,
        ownProps.index
      ),
      serverVersion: state.serverVersion,
      num_stages,
      editor_view_type,
      searchIndexName,
      showSearchIndexDoesNotExistBanner,
    };
  },
  {
    onChange: changeStageValue,
    onViewSearchIndexesClick: openIndexesListDrawerView,
    onCreateSearchIndexClick: openCreateSearchIndexDrawerView,
    onEditSearchIndexClick: openEditSearchIndexDrawerView,
  }
)(StageEditor);
