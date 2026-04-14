import React, { useRef, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
  css,
  WarningSummary,
  Banner,
  Button,
  Icon,
  spacing,
  palette,
  useDarkMode,
  cx,
  useRequiredURLSearchParams,
  useCurrentValueRef,
} from '@mongodb-js/compass-components';
import {
  createAggregationAutocompleter,
  CodemirrorMultilineEditor,
} from '@mongodb-js/compass-editor';
import type { Annotation } from '@mongodb-js/compass-editor';
import type { RootState } from '../../../modules';
import type { MongoServerError } from 'mongodb';
import { changeEditorValue } from '../../../modules/pipeline-builder/text-editor-pipeline';
import type { PipelineParserError } from '../../../modules/pipeline-builder/pipeline-parser/utils';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import {
  useConnectionInfoRef,
  useConnectionInfo,
} from '@mongodb-js/compass-connections/provider';
import { useSyncAssistantGlobalState } from '@mongodb-js/compass-assistant';
import { usePreference } from 'compass-preferences-model/provider';
import { getSearchStageInfoFromPipeline } from '../../../utils/stage';
import type { SearchStageOperator } from '../../../utils/stage';
import {
  openCreateSearchIndexDrawerView,
  openEditSearchIndexDrawerView,
  openIndexesListDrawerView,
} from '../../../modules/search-indexes';
import ServerErrorBanner from '../../server-error-banner';
import {
  isRerankVersionSupported,
  RERANK_MIN_SERVER_VERSION,
} from '../../../utils/search-stage-errors';
import SearchIndexDoesNotExistBanner from '../../search-index-does-not-exist-banner';
import type { SearchIndexType } from '../../../modules/search-indexes';

const containerStyles = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: palette.gray.light3,
  paddingTop: spacing[400],
  paddingBottom: spacing[200],
  gap: spacing[200],
  marginRight: spacing[100],
  borderRadius: spacing[200],
});

const containerDarkStyles = css({
  backgroundColor: palette.gray.dark4,
});

const editorContainerStyles = css({
  flex: '1 1 100%',
  overflow: 'hidden',
});

// We use custom color here so need to disable default one that we use
// everywhere else
const codeEditorStyles = css({
  '& .cm-editor': {
    background: 'transparent !important',
  },
});

const errorContainerStyles = css({
  flex: 'none',
  marginTop: 'auto',
  marginLeft: spacing[400],
  marginRight: spacing[400],
});

const rerankBannerContentStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
});

export type PipelineEditorProps = {
  namespace: string;
  num_stages: number;
  pipelineText: string;
  syntaxErrors: PipelineParserError[];
  serverError: MongoServerError | null;
  serverVersion: string;
  searchIndexName: string | null;
  searchStageOperator: SearchStageOperator | null;
  showSearchIndexDoesNotExistBanner: boolean;
  onChangePipelineText: (value: string) => void;
  onViewSearchIndexesClick: () => void;
  onCreateSearchIndexClick: (searchIndexType: SearchIndexType) => void;
  onEditSearchIndexClick: (indexName: string) => void;
};

export const PipelineEditor: React.FunctionComponent<PipelineEditorProps> = ({
  namespace,
  num_stages,
  pipelineText,
  serverError,
  syntaxErrors,
  serverVersion,
  searchIndexName,
  searchStageOperator,
  showSearchIndexDoesNotExistBanner,
  onChangePipelineText,
  onViewSearchIndexesClick,
  onCreateSearchIndexClick,
  onEditSearchIndexClick,
}) => {
  const fields = useAutocompleteFields(namespace);
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();
  const { atlasMetadata } = useConnectionInfo();
  const editorInitialValueRef = useRef<string>(pipelineText);
  const editorCurrentValueRef = useCurrentValueRef<string>(pipelineText);

  useSyncAssistantGlobalState('currentPipeline', pipelineText);

  const { utmSource, utmMedium } = useRequiredURLSearchParams();

  const completer = useMemo(() => {
    return createAggregationAutocompleter({
      serverVersion,
      fields: fields.filter((field) => !!field.name),
      utmSource,
      utmMedium,
    });
  }, [serverVersion, fields, utmSource, utmMedium]);

  const onBlurEditor = useCallback(() => {
    if (
      !!editorCurrentValueRef.current &&
      editorCurrentValueRef.current !== editorInitialValueRef.current
    ) {
      track(
        'Aggregation Edited',
        {
          num_stages,
          editor_view_type: 'text',
        },
        connectionInfoRef.current
      );
      editorInitialValueRef.current = editorCurrentValueRef.current;
    }
  }, [editorCurrentValueRef, track, num_stages, connectionInfoRef]);

  const annotations: Annotation[] = useMemo(() => {
    return syntaxErrors
      .map((error) => {
        if (!error.loc || !error.loc.index) {
          return null;
        }
        return {
          message: error.message,
          severity: 'error',
          from: error.loc.index,
          to: error.loc.index,
        };
      })
      .filter((annotation): annotation is Annotation => {
        return !!annotation;
      });
  }, [syntaxErrors]);

  const darkMode = useDarkMode();

  const enableSearchActivationProgramP1 = usePreference(
    'enableSearchActivationProgramP1'
  );

  const showRerankVersionWarning =
    pipelineText.includes('$rerank') &&
    !isRerankVersionSupported(serverVersion);

  const showErrorContainer =
    serverError ||
    syntaxErrors.length > 0 ||
    (enableSearchActivationProgramP1 && showSearchIndexDoesNotExistBanner);

  return (
    <div
      className={cx(containerStyles, darkMode && containerDarkStyles)}
      data-testid="pipeline-as-text-editor"
    >
      <div className={editorContainerStyles}>
        <CodemirrorMultilineEditor
          text={pipelineText}
          onChangeText={onChangePipelineText}
          annotations={annotations}
          id="pipeline-text-editor"
          data-testid="pipeline-text-editor"
          completer={completer}
          minLines={16}
          onBlur={onBlurEditor}
          className={codeEditorStyles}
        />
      </div>
      {showRerankVersionWarning && (
        <div className={errorContainerStyles}>
          <Banner
            variant="danger"
            data-testid="pipeline-editor-rerank-version-warning"
          >
            <div className={rerankBannerContentStyles}>
              <span>
                Upgrade your cluster to MongoDB {RERANK_MIN_SERVER_VERSION}+ to
                use $rerank.
              </span>
              {atlasMetadata && (
                <Button
                  size="xsmall"
                  href={`#/clusters/edit/${encodeURIComponent(
                    atlasMetadata.clusterName
                  )}`}
                  target="_blank"
                  rightGlyph={<Icon glyph="OpenNewTab" />}
                >
                  Upgrade Cluster
                </Button>
              )}
            </div>
          </Banner>
        </div>
      )}
      {showErrorContainer && (
        <div
          className={errorContainerStyles}
          data-testid="pipeline-as-text-error-container"
        >
          {syntaxErrors.length > 0 ? (
            <WarningSummary warnings={syntaxErrors.map((x) => x.message)} />
          ) : serverError ? (
            <ServerErrorBanner
              message={serverError.message}
              searchIndexName={searchIndexName}
              dataTestId="pipeline-editor-error-message"
              onEditSearchIndexClick={onEditSearchIndexClick}
            />
          ) : enableSearchActivationProgramP1 &&
            searchStageOperator &&
            showSearchIndexDoesNotExistBanner ? (
            <SearchIndexDoesNotExistBanner
              searchStageOperator={searchStageOperator}
              onViewIndexesClick={onViewSearchIndexesClick}
              onCreateSearchIndexClick={onCreateSearchIndexClick}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

const mapState = ({
  namespace,
  pipelineBuilder: {
    textEditor: {
      pipeline: {
        pipeline,
        pipelineText,
        serverError: pipelineServerError,
        syntaxErrors,
      },
      outputStage: { serverError: outputStageServerError },
    },
  },
  serverVersion,
  searchIndexes: { indexes: searchIndexes, status: searchIndexesStatus },
}: RootState) => {
  const { searchIndexName, searchStageOperator } =
    getSearchStageInfoFromPipeline(pipelineText);
  const showSearchIndexDoesNotExistBanner =
    !!searchIndexName &&
    !!searchStageOperator &&
    ['READY', 'POLLING'].includes(searchIndexesStatus) &&
    searchIndexes.every((x) => x.name !== searchIndexName);

  return {
    namespace,
    num_stages: pipeline.length,
    pipelineText,
    serverError: pipelineServerError ?? outputStageServerError,
    syntaxErrors,
    serverVersion,
    searchIndexName,
    searchStageOperator,
    showSearchIndexDoesNotExistBanner,
  };
};

const mapDispatch = {
  onChangePipelineText: changeEditorValue,
  onViewSearchIndexesClick: openIndexesListDrawerView,
  onCreateSearchIndexClick: openCreateSearchIndexDrawerView,
  onEditSearchIndexClick: openEditSearchIndexDrawerView,
};

export default connect(mapState, mapDispatch)(PipelineEditor);
