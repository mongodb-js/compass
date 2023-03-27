import React, { useRef, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
  ErrorSummary,
  css,
  WarningSummary,
  spacing,
  palette,
  useDarkMode,
  cx,
} from '@mongodb-js/compass-components';
import type { CompletionWithServerInfo } from '@mongodb-js/compass-editor';
import {
  createAggregationAutocompleter,
  CodemirrorMultilineEditor,
} from '@mongodb-js/compass-editor';
import type { Annotation } from '@mongodb-js/compass-editor';
import type { RootState } from '../../../modules';
import type { MongoServerError } from 'mongodb';
import { changeEditorValue } from '../../../modules/pipeline-builder/text-editor-pipeline';
import type { PipelineParserError } from '../../../modules/pipeline-builder/pipeline-parser/utils';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const containerStyles = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: palette.gray.light3,
  paddingTop: spacing[3],
  paddingBottom: spacing[2],
  gap: spacing[2],
  marginRight: spacing[1],
});

const containerDarkStyles = css({
  backgroundColor: palette.gray.dark4,
});

const editorContainerStyles = css({
  flex: '1 1 100%',
  overflow: 'hidden',
});

const errorContainerStyles = css({
  flex: 'none',
  marginTop: 'auto',
  marginLeft: spacing[3],
  marginRight: spacing[3],
});

type PipelineEditorProps = {
  num_stages: number;
  pipelineText: string;
  syntaxErrors: PipelineParserError[];
  serverError: MongoServerError | null;
  serverVersion: string;
  fields: CompletionWithServerInfo[];
  onChangePipelineText: (value: string) => void;
};

export const PipelineEditor: React.FunctionComponent<PipelineEditorProps> = ({
  num_stages,
  pipelineText,
  serverError,
  syntaxErrors,
  serverVersion,
  fields,
  onChangePipelineText,
}) => {
  const editorInitialValueRef = useRef<string>(pipelineText);
  const editorCurrentValueRef = useRef<string>(pipelineText);
  editorCurrentValueRef.current = pipelineText;

  const completer = useMemo(() => {
    return createAggregationAutocompleter({
      serverVersion,
      fields: fields.filter(
        (field): field is { name: string } & CompletionWithServerInfo =>
          !!field.name
      ),
    });
  }, [serverVersion, fields]);

  const onBlurEditor = useCallback(() => {
    if (
      !!editorCurrentValueRef.current &&
      editorCurrentValueRef.current !== editorInitialValueRef.current
    ) {
      track('Aggregation Edited', {
        num_stages,
        editor_view_type: 'text',
      });
      editorInitialValueRef.current = editorCurrentValueRef.current;
    }
  }, [editorInitialValueRef, num_stages]);

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

  const showErrorContainer = serverError || syntaxErrors.length > 0;

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
        />
      </div>
      {showErrorContainer && (
        <div
          className={errorContainerStyles}
          data-testid="pipeline-as-text-error-container"
        >
          {syntaxErrors.length > 0 ? (
            <WarningSummary warnings={syntaxErrors.map((x) => x.message)} />
          ) : serverError ? (
            <ErrorSummary errors={serverError.message} />
          ) : null}
        </div>
      )}
    </div>
  );
};

const mapState = ({
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
  fields,
}: RootState) => ({
  num_stages: pipeline.length,
  pipelineText,
  serverError: pipelineServerError ?? outputStageServerError,
  syntaxErrors,
  serverVersion,
  fields,
});

const mapDispatch = {
  onChangePipelineText: changeEditorValue,
};

export default connect(mapState, mapDispatch)(PipelineEditor);
