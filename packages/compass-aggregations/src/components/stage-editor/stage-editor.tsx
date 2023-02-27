import React, { useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import type { MongoServerError } from 'mongodb';
import {
  Editor,
  EditorVariant,
  EditorTextCompleter,
  StageAutoCompleter,
} from '@mongodb-js/compass-editor';
import type {
  AceEditor,
  CompletionWithServerInfo,
  AceAnnotation,
} from '@mongodb-js/compass-editor';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import {
  css,
  cx,
  spacing,
  palette,
  Banner,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { changeStageValue } from '../../modules/pipeline-builder/stage-editor';
import { mapPipelineModeToEditorViewType } from '../../modules/pipeline-builder/builder-helpers';
import type { RootState } from '../../modules';
import type { PipelineParserError } from '../../modules/pipeline-builder/pipeline-parser/utils';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const editorContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  overflow: 'hidden',
  height: '100%',
});

const editorStyles = css({
  flex: 1,
  flexShrink: 0,
  margin: 0,
  width: '100%',
  minHeight: '230px',
});

const editorContainerStylesDark = css({
  background: palette.gray.dark4,
});

const editorContainerStylesLight = css({
  background: palette.gray.light3,
});

const aceEditorStyles = css({
  minHeight: '160px',
});

const bannerStyles = css({
  flex: 'none',
  marginTop: spacing[2],
  marginLeft: spacing[2],
  marginRight: spacing[2],
  textAlign: 'left',
});

type StageEditorProps = {
  index: number;
  stageOperator: string | null;
  stageValue: string | null;
  serverVersion: string;
  autocompleteFields: CompletionWithServerInfo[];
  syntaxError: PipelineParserError | null;
  serverError: MongoServerError | null;
  num_stages: number;
  editor_view_type: string;
  className?: string;
  onChange: (index: number, value: string) => void;
  onLoad?: (editor: AceEditor) => void;
};

function useStageCompleter(
  ...args: ConstructorParameters<typeof StageAutoCompleter>
): StageAutoCompleter {
  const [version, textCompleter, fields, operator] = args;
  const completer = useRef<StageAutoCompleter>();
  if (!completer.current) {
    completer.current = new StageAutoCompleter(
      version,
      textCompleter,
      fields,
      operator
    );
  }
  useEffect(() => {
    completer.current?.update(fields, operator ?? null, version);
  }, [fields]);
  return completer.current;
}

export const StageEditor = ({
  stageValue,
  stageOperator,
  index,
  onChange,
  serverError,
  syntaxError,
  className,
  autocompleteFields,
  serverVersion,
  num_stages,
  editor_view_type,
  onLoad,
}: StageEditorProps) => {
  const darkMode = useDarkMode();
  const editorInitialValueRef = useRef<string | null>(stageValue);
  const editorRef = useRef<AceEditor | undefined>(undefined);
  const completer = useStageCompleter(
    serverVersion,
    EditorTextCompleter,
    autocompleteFields,
    stageOperator
  );

  useEffect(() => {
    let annotations: AceAnnotation[] = [];
    if (syntaxError && syntaxError.loc) {
      const { line: row, column } = syntaxError.loc;
      annotations = [
        {
          row: row - 1,
          column,
          text: syntaxError.message,
          type: 'error',
        },
      ];
    }
    editorRef.current?.getSession().setAnnotations(annotations);
  }, [syntaxError, editorRef]);

  const onBlurEditor = useCallback(() => {
    const value = editorRef.current?.getValue();
    if (value !== undefined && value !== editorInitialValueRef.current) {
      track('Aggregation Edited', {
        num_stages: num_stages,
        stage_index: index + 1,
        stage_action: 'stage_content_changed',
        stage_name: stageOperator,
        editor_view_type: editor_view_type,
      });
      editorInitialValueRef.current = value;
    }
  }, [
    editorRef,
    editorInitialValueRef,
    num_stages,
    index,
    stageOperator,
    editor_view_type,
  ]);

  return (
    <div
      className={cx(
        editorContainerStyles,
        darkMode ? editorContainerStylesDark : editorContainerStylesLight,
        className
      )}
    >
      <div className={editorStyles}>
        <Editor
          text={stageValue ?? ''}
          onChangeText={(value) => onChange(index, value)}
          variant={EditorVariant.Shell}
          className={aceEditorStyles}
          name={`aggregations-stage-editor-${index}`}
          options={{ minLines: 5 }}
          completer={completer}
          onLoad={(editor) => {
            editorRef.current = editor;
            onLoad?.(editor);
          }}
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
      {serverError && (
        <Banner
          variant="danger"
          data-testid="stage-editor-error-message"
          title={serverError.message}
          className={bannerStyles}
        >
          {serverError.message}
        </Banner>
      )}
    </div>
  );
};

export default connect(
  (state: RootState, ownProps: { index: number }) => {
    const stages = state.pipelineBuilder.stageEditor.stages;
    const stage = stages[ownProps.index];
    const num_stages = stages.length;
    return {
      stageValue: stage.value,
      stageOperator: stage.stageOperator,
      syntaxError: !stage.empty ? stage.syntaxError ?? null : null,
      serverError: !stage.empty ? stage.serverError ?? null : null,
      serverVersion: state.serverVersion,
      autocompleteFields: state.fields as CompletionWithServerInfo[],
      num_stages,
      editor_view_type: mapPipelineModeToEditorViewType(state),
    };
  },
  { onChange: changeStageValue }
)(StageEditor);
