import React, { useEffect, useRef, useCallback } from 'react';
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
  Editor,
  EditorVariant,
  EditorTextCompleter,
  AggregationAutoCompleter,
} from '@mongodb-js/compass-editor';
import type { AceEditor, AceAnnotation } from '@mongodb-js/compass-editor';
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
  backgroundColor: palette.gray.dark3,
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

function useAggregationCompleter(
  ...args: ConstructorParameters<typeof AggregationAutoCompleter>
): AggregationAutoCompleter {
  const [version, textCompleter, fields] = args;
  const completer = useRef<AggregationAutoCompleter>();
  if (!completer.current) {
    completer.current = new AggregationAutoCompleter(
      version,
      textCompleter,
      fields
    );
  }
  useEffect(() => {
    completer.current?.updateFields(fields);
  }, [fields]);
  return completer.current;
}

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
  const editorRef = useRef<AceEditor | undefined>(undefined);
  const completer = useAggregationCompleter(
    serverVersion,
    EditorTextCompleter,
    fields
  );

  const onBlurEditor = useCallback(() => {
    const value = editorRef.current?.getValue();
    if (
      value !== undefined &&
      value !== editorInitialValueRef.current
    ) {
      track('Aggregation Edited', {
        num_stages,
        editor_view_type: 'text',
      });
      editorInitialValueRef.current = value;
    }
  }, [editorRef, editorInitialValueRef, num_stages]);

  const onLoadEditor = useCallback((editor: AceEditor) => {
    editorRef.current = editor;
  }, []);

  useEffect(() => {
    let annotations: AceAnnotation[] = [];
    if (syntaxErrors.length > 0) {
      annotations = syntaxErrors
        .map((error) => {
          if (!error.loc) {
            return null;
          }
          const { line: row, column } = error.loc;
          return {
            row: row - 1,
            column,
            text: error.message,
            type: 'error',
          };
        })
        .filter(Boolean) as AceAnnotation[];
    }
    editorRef.current?.getSession().setAnnotations(annotations);
  }, [syntaxErrors, editorRef]);

  const darkMode = useDarkMode();

  const showErrorContainer = serverError || syntaxErrors.length > 0;

  return (
    <div className={cx(containerStyles, darkMode && containerDarkStyles)} data-testid="pipeline-as-text-editor">
      <div className={editorContainerStyles}>
        <Editor
          text={pipelineText}
          onChangeText={onChangePipelineText}
          variant={EditorVariant.Shell}
          name={'pipeline-text-editor'}
          data-testid={'pipeline-text-editor'}
          completer={completer}
          options={{ minLines: 16 }}
          onLoad={onLoadEditor}
          onBlur={onBlurEditor}
        />
      </div>
      {showErrorContainer && (
        <div className={errorContainerStyles} data-testid="pipeline-as-text-error-container">
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
