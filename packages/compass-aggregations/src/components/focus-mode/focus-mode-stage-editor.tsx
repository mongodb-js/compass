import React, { useRef } from 'react';
import { css, spacing, Link, rafraf } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { EditorRef } from '@mongodb-js/compass-editor';
import StageEditor from '../stage-editor/stage-editor';
import { getStageHelpLink } from '../../utils/stage';
import type { RootState } from '../../modules';
import StageOperatorSelect from '../stage-toolbar/stage-operator-select';
import { PIPELINE_HELP_URI } from '../../constants';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';

const containerStyles = css({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const headerStyles = css({
  display: 'flex',
  justifyContent: 'flex-start',
  gap: spacing[200],
  marginLeft: spacing[200],
  marginRight: spacing[200],
  flexWrap: 'wrap',
});

const editorStyles = css({
  flex: 1,
  overflowY: 'auto',
  paddingBottom: spacing[400],
});

export const FocusModeStageEditor = ({
  index,
  operator,
}: {
  index: number;
  operator: string | null;
}) => {
  const editorRef = useRef<EditorRef>(null);
  if (index === -1) {
    return null;
  }
  const link = getStageHelpLink(operator) || PIPELINE_HELP_URI;
  return (
    <div className={containerStyles}>
      <div className={headerStyles}>
        <StageOperatorSelect
          onChange={(_index, _name, snippet) => {
            // Accounting for Combobox moving focus back to the input on stage
            // change
            rafraf(() => {
              editorRef.current?.focus();
              if (snippet) {
                editorRef.current?.applySnippet(snippet);
              }
            });
          }}
          index={index}
        />
        <Link hideExternalIcon={false} href={link} target="_blank">
          Open docs
        </Link>
      </div>
      <div className={editorStyles}>
        <StageEditor editorRef={editorRef} index={index} />
      </div>
    </div>
  );
};

const mapState = ({
  focusMode: { stageIndex },
  pipelineBuilder: {
    stageEditor: { stages },
  },
}: RootState) => {
  const currentStage = stages[stageIndex] as StoreStage;
  return {
    index: stageIndex,
    operator: currentStage?.stageOperator,
  };
};

export default connect(mapState)(FocusModeStageEditor);
