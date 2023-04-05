import React, { useCallback, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import type { MongoServerError } from 'mongodb';
import {
  CodemirrorMultilineEditor,
  createStageAutocompleter,
} from '@mongodb-js/compass-editor';
import type { Annotation, EditorRef } from '@mongodb-js/compass-editor';
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

const codeEditorContainerStyles = css({
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

// We use custom color here so need to disable default one that we use
// everywhere else
const codeEditorStyles = css({
  '& .cm-editor': {
    background: 'transparent !important',
  },
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
  autocompleteFields: { name: string; description?: string }[];
  syntaxError: PipelineParserError | null;
  serverError: MongoServerError | null;
  num_stages: number;
  editor_view_type: string;
  className?: string;
  onChange: (index: number, value: string) => void;
  editorRef?: React.Ref<EditorRef>;
};

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
  editorRef,
}: StageEditorProps) => {
  const darkMode = useDarkMode();
  const editorInitialValueRef = useRef<string | null>(stageValue);
  const editorCurrentValueRef = useRef<string | null>(stageValue);
  editorCurrentValueRef.current = stageValue;

  const completer = useMemo(() => {
    return createStageAutocompleter({
      serverVersion,
      stageOperator: stageOperator ?? undefined,
      fields: autocompleteFields,
    });
  }, [autocompleteFields, serverVersion, stageOperator]);

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
      track('Aggregation Edited', {
        num_stages: num_stages,
        stage_index: index + 1,
        stage_action: 'stage_content_changed',
        stage_name: stageOperator,
        editor_view_type: editor_view_type,
      });
      editorInitialValueRef.current = editorCurrentValueRef.current;
    }
  }, [
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
    if (stage.type !== 'stage') {
      throw new Error('Expected stage to be BuilderStage');
    }
    return {
      stageValue: stage.value,
      stageOperator: stage.stageOperator,
      syntaxError: !stage.empty ? stage.syntaxError ?? null : null,
      serverError: !stage.empty ? stage.serverError ?? null : null,
      serverVersion: state.serverVersion,
      autocompleteFields: state.fields as {
        name: string;
        description?: string;
      }[],
      num_stages,
      editor_view_type: mapPipelineModeToEditorViewType(state),
    };
  },
  { onChange: changeStageValue }
)(StageEditor);
