import React from 'react';
import { connect } from 'react-redux';
import { css, cx, spacing, useFocusRing } from '@mongodb-js/compass-components';
import { Editor, EditorVariant } from '@mongodb-js/compass-editor';
import type { RootState } from '../../modules';
import type { MongoServerError, Document } from 'mongodb';
import { changeEditorValue } from '../../modules/pipeline-builder/text-editor';

const containerStyles = css({
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[2],
  marginBottom: spacing[3],
  paddingLeft: spacing[3] + spacing[1],
  paddingRight: spacing[5] + spacing[1],
});

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

const editorContainerStyles = css({
  // flex: 1,
  width: '30%',
  overflow: 'scroll',
});
const resultsContainerStyles = css({
  flex: 1,
  overflow: 'scroll',
});

type PipelineResultsWorkspaceProps = {
  pipelineText: string;
  syntaxErrors: SyntaxError[];
  serverError: MongoServerError | null;
  loading: boolean;
  previewDocs: Document[] | null;

  onChangePipelineText: (value: string) => void;
};

export const PipelineAsTextWorkspace: React.FunctionComponent<
  PipelineResultsWorkspaceProps
> = ({ pipelineText, syntaxErrors, onChangePipelineText }) => {
  const focusRingProps = useFocusRing({
    outer: true,
    focusWithin: true,
    hover: true,
  });

  return (
    <div data-testid="pipeline-as-text-workspace" className={containerStyles}>
      <div className={editorContainerStyles}>
        <Editor
          text={pipelineText}
          onChangeText={(value: string) => onChangePipelineText(value)}
          variant={EditorVariant.Shell}
          className={cx(
            editorStyles,
            focusRingProps.className,
            syntaxErrors.length > 0 && editorWithErrorStyles
          )}
          name={'pipeline-as-text-workspace'}
          options={{ minLines: 50 }}
        />
      </div>
      <div className={resultsContainerStyles}></div>
    </div>
  );
};

const mapState = ({
  pipelineBuilder: {
    textEditor: {
      pipelineText,
      loading,
      previewDocs,
      serverError,
      syntaxErrors,
    },
  },
}: RootState) => ({
  pipelineText,
  loading,
  previewDocs,
  serverError,
  syntaxErrors,
});

const mapDispatch = {
  onChangePipelineText: changeEditorValue,
};

export default connect(mapState, mapDispatch)(PipelineAsTextWorkspace);
