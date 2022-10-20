import React from 'react';
import { connect } from 'react-redux';
import { css, cx, spacing } from '@mongodb-js/compass-components';
import { Editor, EditorVariant } from '@mongodb-js/compass-editor';
import type { RootState } from '../../../modules';
import type { MongoServerError } from 'mongodb';
import { changeEditorValue } from '../../../modules/pipeline-builder/text-editor';

const editorStyles = css({
  minWidth: spacing[7],
  border: '1px solid transparent',
  borderRadius: spacing[1],
  overflow: 'visible',
});

const editorWithErrorStyles = css({
  // borderColor: uiColors.red.base,
  '&:focus-within': {
    // borderColor: uiColors.gray.base,
  },
});

type PipelineEditorProps = {
  pipelineText: string;
  syntaxErrors: SyntaxError[];
  serverError: MongoServerError | null;
  onChangePipelineText: (value: string) => void;
};

export const PipelineEditor: React.FunctionComponent<PipelineEditorProps> = ({
  pipelineText,
  syntaxErrors,
  onChangePipelineText,
}) => {
  return (
    <Editor
      text={pipelineText}
      onChangeText={(value: string) => onChangePipelineText(value)}
      variant={EditorVariant.Shell}
      className={cx(
        editorStyles,
        syntaxErrors.length > 0 && editorWithErrorStyles
      )}
      name={'pipeline-as-text-workspace'}
      options={{ minLines: 50 }}
    />
  );
};

const mapState = ({
  pipelineBuilder: {
    textEditor: { pipelineText, serverError, syntaxErrors },
  },
}: RootState) => ({
  pipelineText,
  serverError,
  syntaxErrors,
});

const mapDispatch = {
  onChangePipelineText: changeEditorValue,
};

export default connect(mapState, mapDispatch)(PipelineEditor);
