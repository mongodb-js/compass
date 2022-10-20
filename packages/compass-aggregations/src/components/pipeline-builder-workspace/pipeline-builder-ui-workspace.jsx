import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Stage from '../stage';
import Input from '../input';
import AddStage from '../add-stage';
import ModifySourceBanner from '../modify-source-banner';

import { sortableContainer, sortableElement } from 'react-sortable-hoc';

import styles from './pipeline-builder-ui-workspace.module.less';
import {
  refreshInputDocuments,
  toggleInputDocumentsCollapsed,
} from '../../modules/input-documents';
import { openLink } from '../../modules/link';
import { moveStage } from '../../modules/pipeline-builder/stage-editor';

const SortableStage = sortableElement(({ idx, ...props }) => {
  return <Stage index={idx} {...props}></Stage>;
});

const SortableContainer = sortableContainer(({ children }) => {
  return <div>{children}</div>;
});

export class PipelineBuilderUIWorkspace extends PureComponent {
  static displayName = 'PipelineBuilderUIWorkspace';

  static propTypes = {
    stageIds: PropTypes.array.isRequired,
    editViewName: PropTypes.string,
    inputDocuments: PropTypes.object.isRequired,
    onStageMoveEnd: PropTypes.func.isRequired,
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired,
    refreshInputDocuments: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired
  };

  /**
   * The stage moved handler.
   *
   * @param {Number} fromIndex - The original index.
   * @param {Number} toIndex - The index to move to.
   */
  onStageMoved = ({ oldIndex, newIndex }) => {
    this.props.onStageMoveEnd(oldIndex, newIndex);
  };

  /**
   * Render the modify source banner if neccessary.
   *
   * @returns {Component} The component.
   */
  renderModifyingViewSourceBanner() {
    if (this.props.editViewName) {
      return <ModifySourceBanner editViewName={this.props.editViewName} />;
    }
  }

  /**
   * Render a stage list.
   *
   * @returns {Component} The component.
   */
  renderStageList = () => {
    return (
      <SortableContainer
        axis="y"
        lockAxis="y"
        onSortEnd={this.onStageMoved}
        useDragHandle
        transitionDuration={0}
        helperContainer={() => {
          return this.stageListContainerRef ?? document.body;
        }}
        helperClass="dragging"
        // Slight distance requirement to prevent sortable logic messing with
        // interactive elements in the handler toolbar component
        distance={10}
      >
        {this.props.stageIds.map((id, index) => {
          return <SortableStage key={id} idx={index} index={index} />;
        })}
      </SortableContainer>
    );
  };

  /**
   * Renders the pipeline workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const inputDocuments = this.props.inputDocuments;
    return (
      <div
        data-testid="pipeline-builder-ui-workspace"
        ref={(ref) => {
          this.stageListContainerRef = ref;
        }}
      >
        <div className={styles['pipeline-workspace-container']}>
          <div className={styles['pipeline-workspace']}>
            {this.renderModifyingViewSourceBanner()}
            <Input
              toggleInputDocumentsCollapsed={
                this.props.toggleInputDocumentsCollapsed
              }
              refreshInputDocuments={this.props.refreshInputDocuments}
              documents={inputDocuments.documents}
              isLoading={inputDocuments.isLoading}
              isExpanded={inputDocuments.isExpanded}
              openLink={this.props.openLink}
              count={inputDocuments.count}
            />
            {this.renderStageList()}
            <AddStage />
          </div>
        </div>
      </div>
    );
  }
}

/**
 *
 * @param {import('./../../modules/').RootState} state
 */
const mapState = (state) => ({
  stageIds: state.pipelineBuilder.stageEditor.stageIds,
  editViewName: state.editViewName,
  inputDocuments: state.inputDocuments
});

const mapDispatch = {
  onStageMoveEnd: moveStage,
  toggleInputDocumentsCollapsed,
  refreshInputDocuments,
  openLink
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
