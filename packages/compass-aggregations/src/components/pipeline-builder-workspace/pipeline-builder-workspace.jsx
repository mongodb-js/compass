import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import Stage from '../stage';
import Input from '../input';
import AddStage from '../add-stage';
import ModifySourceBanner from '../modify-source-banner';

import { sortableContainer, sortableElement } from 'react-sortable-hoc';

import styles from './pipeline-builder-workspace.module.less';
import { connect } from 'react-redux';
import {
  refreshInputDocuments,
  toggleInputDocumentsCollapsed
} from '../../modules/input-documents';
import { openLink } from '../../modules/link';
import {
  addStage,
  moveStage
} from '../../modules/pipeline-builder/stage-editor';

const SortableStage = sortableElement(({ idx }) => {
  return <Stage index={idx}></Stage>;
});

const SortableContainer = sortableContainer(({ children }) => {
  return <div>{children}</div>;
});

/**
 * The pipeline workspace component.
 */
class PipelineWorkspace extends PureComponent {
  static displayName = 'PipelineWorkspace';

  static propTypes = {
    editViewName: PropTypes.string,
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired,
    refreshInputDocuments: PropTypes.func.isRequired,
    stageAdded: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    inputDocuments: PropTypes.object.isRequired,
    stageMoved: PropTypes.func.isRequired,
    stagesCount: PropTypes.number.isRequired,
    isOverviewOn: PropTypes.bool.isRequired
  };

  /**
   * The stage moved handler.
   *
   * @param {Number} fromIndex - The original index.
   * @param {Number} toIndex - The index to move to.
   */
  onStageMoved = ({ oldIndex, newIndex }) => {
    this.props.stageMoved(oldIndex, newIndex);
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
          return this.stageListContainerRef ?? document.body
        }}
        helperClass="dragging"
        // Slight distance requirement to prevent sortable logic messing with
        // interactive elements in the handler toolbar component
        distance={10}
      >
        {Array.from({ length: this.props.stagesCount }, (_, idx) => {
          return (
            <SortableStage key={idx} index={idx} idx={idx}></SortableStage>
          );
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
        data-testid="pipeline-builder-workspace"
        className={styles['pipeline-workspace-container-container']}
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
              isOverviewOn={this.props.isOverviewOn}
            />
            {this.renderStageList()}
            <AddStage stageAdded={this.props.stageAdded} />
          </div>
        </div>
      </div>
    );
  }
}

const mapState = (state) => {
  return {
    editViewName: state.editViewName,
    inputDocuments: state.inputDocuments,
    isOverviewOn: state.isOverviewOn,
    stagesCount: state.pipelineBuilder.stageEditor.stagesCount
  };
};

const mapDispatch = {
  toggleInputDocumentsCollapsed,
  refreshInputDocuments,
  openLink,
  stageAdded() {
    return addStage();
  },
  stageMoved: moveStage
};

export default connect(mapState, mapDispatch)(React.memo(PipelineWorkspace));
