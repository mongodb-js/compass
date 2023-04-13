import React from 'react';
import { connect } from 'react-redux';
import PipelineBuilderInputDocuments from '../../pipeline-builder-input-documents';
import AddStage from '../../add-stage';
import ModifySourceBanner from '../../modify-source-banner';
import type { StageIdAndType } from '../../../modules/pipeline-builder/stage-editor';
import {
  addStage,
  moveStage,
} from '../../../modules/pipeline-builder/stage-editor';
import type { RootState } from '../../../modules';
import { css } from '@mongodb-js/compass-components';
import { SortableList } from './sortable-list';

const pipelineWorkspaceContainerStyles = css({
  position: 'relative',
  width: '100%',
  height: '100%',
});

const pipelineWorkspaceStyles = css({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  flexGrow: 1,
});

type PipelineBuilderUIWorkspaceProps = {
  stagesIdAndType: StageIdAndType[];
  editViewName?: string;
  onStageMoveEnd: (from: number, to: number) => void;
  onStageAddAfterEnd: (after?: number) => void;
};

export const PipelineBuilderUIWorkspace: React.FunctionComponent<
  PipelineBuilderUIWorkspaceProps
> = ({ stagesIdAndType, editViewName, onStageMoveEnd, onStageAddAfterEnd }) => {
  return (
    <div data-testid="pipeline-builder-ui-workspace">
      <div className={pipelineWorkspaceContainerStyles}>
        <div className={pipelineWorkspaceStyles}>
          {editViewName && <ModifySourceBanner editViewName={editViewName} />}
          <PipelineBuilderInputDocuments />
          {stagesIdAndType.length !== 0 && (
            <AddStage
              onAddStage={() => onStageAddAfterEnd(-1)}
              variant="icon"
            />
          )}
          <SortableList
            stagesIdAndType={stagesIdAndType}
            onStageMoveEnd={onStageMoveEnd}
            onStageAddAfterEnd={onStageAddAfterEnd}
          />

          <AddStage onAddStage={onStageAddAfterEnd} variant="button" />
        </div>
      </div>
    </div>
  );
};

const mapState = (state: RootState) => {
  return {
    stagesIdAndType: state.pipelineBuilder.stageEditor.stagesIdAndType,
    editViewName: state.editViewName,
  };
};

const mapDispatch = {
  onStageMoveEnd: moveStage,
  onStageAddAfterEnd: addStage,
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
