import React, { useEffect, useRef, useCallback } from 'react';
import { connect } from 'react-redux';
import {
  ErrorSummary,
  css,
  WarningSummary,
  spacing,
  palette,
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

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  justifyContent: 'space-between',
});

const editorContainerStyles = css({
  backgroundColor: palette.gray.light3,
  height: '100%',
  overflow: 'scroll',
  padding: spacing[3],
});

const errorContainerStyles = css({ margin: spacing[2] });

type PipelineEditorProps = {
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
  pipelineText,
  serverError,
  syntaxErrors,
  serverVersion,
  fields,
  onChangePipelineText,
}) => {
  const editorRef = useRef<AceEditor | undefined>(undefined);
  const completer = useAggregationCompleter(
    serverVersion,
    EditorTextCompleter,
    fields
  );

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

  const showErrorContainer = serverError || syntaxErrors.length > 0;

  return (
    <div className={containerStyles} data-testid="pipeline-as-text-editor">
      <div className={editorContainerStyles}>
        <Editor
          text={pipelineText}
          onChangeText={onChangePipelineText}
          variant={EditorVariant.Shell}
          name={'pipeline-text-editor'}
          completer={completer}
          options={{ minLines: 16 }}
          onLoad={onLoadEditor}
        />
      </div>
      {showErrorContainer && (
        <div className={errorContainerStyles}>
          {serverError && <ErrorSummary errors={serverError.message} />}
          {syntaxErrors.length > 0 && (
            <WarningSummary warnings={syntaxErrors.map((x) => x.message)} />
          )}
        </div>
      )}
    </div>
  );
};

const mapState = ({
  pipelineBuilder: {
    textEditor: {
      pipeline: {
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
