import React from 'react';
import { connect } from 'react-redux';
import { Resizable } from 're-resizable';
import { css, spacing } from '@mongodb-js/compass-components';

import { SortableList } from './sortable-list';
import ResizeHandle from '../../resize-handle';
import type { RootState } from '../../../modules';
import {
  addStage,
  moveStage,
} from '../../../modules/pipeline-builder/stage-editor';
import ModifySourceBanner from '../../modify-source-banner';
import AggregationSidePanel from '../../aggregation-side-panel';
import { addWizard } from '../../../modules/pipeline-builder/stage-editor';
import PipelineBuilderInputDocuments from '../../pipeline-builder-input-documents';
import AddStage from '../../add-stage';
import UseCaseDroppableArea from '../../use-case-droppable-area';
import type { StageIdAndType } from '../../../modules/pipeline-builder/stage-editor';
import PipelineBuilderDndWrapper from './dnd-wrapper';

const pipelineWorkspaceContainerStyles = css({
  position: 'relative',
  height: '100%',
  paddingBottom: spacing[3],
  width: '100%',
  overflow: 'auto',
});

const pipelineWorkspaceStyles = css({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  flexGrow: 1,
});

export type PipelineBuilderUIWorkspaceProps = {
  stagesIdAndType: StageIdAndType[];
  editViewName?: string;
  isSidePanelOpen: boolean;
  onStageMoveEnd: (from: number, to: number) => void;
  onStageAddAfterEnd: (after?: number) => void;
  onUseCaseDropped: (
    useCaseId: string,
    stageOperator: string,
    after?: number
  ) => void;
};

export const PipelineBuilderUIWorkspace: React.FunctionComponent<
  PipelineBuilderUIWorkspaceProps
> = ({
  stagesIdAndType,
  editViewName,
  isSidePanelOpen,
  onStageMoveEnd,
  onStageAddAfterEnd,
  onUseCaseDropped,
}) => {
  return (
    <PipelineBuilderDndWrapper
      stagesIdAndType={stagesIdAndType}
      onStageMoveEnd={onStageMoveEnd}
      onUseCaseDropped={onUseCaseDropped}
    >
      <div
        data-testid="pipeline-builder-ui-workspace"
        className={pipelineWorkspaceContainerStyles}
      >
        <div className={pipelineWorkspaceStyles}>
          {editViewName && <ModifySourceBanner editViewName={editViewName} />}
          <PipelineBuilderInputDocuments />
          <SortableList
            stagesIdAndType={stagesIdAndType}
            onStageAddAfterEnd={onStageAddAfterEnd}
          />
          <UseCaseDroppableArea index={stagesIdAndType.length - 1} />
          <AddStage variant="button" onAddStage={onStageAddAfterEnd} />
        </div>
      </div>
      {isSidePanelOpen && (
        <Resizable
          defaultSize={{ width: '25%', height: 'auto' }}
          minWidth={'15%'}
          maxWidth={'50%'}
          enable={{ left: true }}
          handleComponent={{ left: <ResizeHandle /> }}
          handleStyles={{
            left: {
              left: '-1px', // default is -5px
              // The sidepanel container is a card with radius.
              // Having padding top, cleans the UI.
              paddingTop: spacing[2],
            },
          }}
        >
          <AggregationSidePanel />
        </Resizable>
      )}
    </PipelineBuilderDndWrapper>
  );
};

const mapState = (state: RootState) => {
  return {
    stagesIdAndType: state.pipelineBuilder.stageEditor.stagesIdAndType,
    editViewName: state.editViewName,
    isSidePanelOpen: state.sidePanel.isPanelOpen,
  };
};

const mapDispatch = {
  onStageMoveEnd: moveStage,
  onStageAddAfterEnd: addStage,
  onUseCaseDropped: addWizard,
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
