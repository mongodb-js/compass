import React, { useEffect, useRef, useCallback } from 'react';
import { connect } from 'react-redux';
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
import { changeEditorValue } from '../../../modules/pipeline-builder/text-editor';
import type { PipelineParserError } from '../../../modules/pipeline-builder/pipeline-parser/utils';

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

  return (
    <Editor
      text={pipelineText}
      onChangeText={onChangePipelineText}
      variant={EditorVariant.Shell}
      name={'pipeline-as-text-workspace'}
      completer={completer}
      options={{ minLines: 40 }}
      onLoad={onLoadEditor}
    />
  );
};

const mapState = ({
  pipelineBuilder: {
    textEditor: { pipelineText, serverError, syntaxErrors },
  },
  serverVersion,
  fields,
}: RootState) => ({
  pipelineText,
  serverError,
  syntaxErrors,
  serverVersion,
  fields,
});

const mapDispatch = {
  onChangePipelineText: changeEditorValue,
};

export default connect(mapState, mapDispatch)(PipelineEditor);
