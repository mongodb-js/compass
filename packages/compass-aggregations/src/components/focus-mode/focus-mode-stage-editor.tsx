import React from 'react';
import { css, spacing, Link } from '@mongodb-js/compass-components';

import StageEditor from '../stage-editor/stage-editor';
import { getStageHelpLink } from '../../utils/stage';
import type { RootState } from '../../modules';
import { connect } from 'react-redux';
import StageOperatorSelect from '../stage-toolbar/stage-operator-select';

const containerStyles = css({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
});

const headerStyles = css({
  display: 'flex',
  justifyContent: 'flex-start',
  gap: spacing[2],
  marginLeft: spacing[2],
  marginRight: spacing[2],
  flexWrap: 'wrap',
});

const editorStyles = css({
  flex: 1,
  overflowY: 'auto',
  paddingBottom: spacing[3],
});

export const FocusModeStageEditor = ({
  index,
  operator,
}: {
  index: number;
  operator: string | null;
}) => {
  if (index === -1) {
    return null;
  }
  const link = getStageHelpLink(operator);
  return (
    <div className={containerStyles}>
      <div className={headerStyles}>
        <StageOperatorSelect index={index} />
        {link && (
          <Link hideExternalIcon={false} href={link} target="_blank">
            Open docs
          </Link>
        )}
      </div>
      <div className={editorStyles}>
        {/* @ts-expect-error requires stage-editor.jsx to be converted */}
        <StageEditor index={index} />
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
  const currentStage = stages[stageIndex];
  return {
    index: stageIndex,
    operator: currentStage?.stageOperator,
  };
};

export default connect(mapState)(FocusModeStageEditor);
