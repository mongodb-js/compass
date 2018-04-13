import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TextButton, IconButton } from 'hadron-react-buttons';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import styles from './pipeline-builder-toolbar.less';

/**
 * The pipeline builder toolbar component.
 */
class PipelineBuilderToolbar extends PureComponent {
  static displayName = 'PipelineBuilderToolbarComponent';

  static propTypes = {
    savedPipelinesListToggle: PropTypes.func.isRequired,
    getSavedPipelines: PropTypes.func.isRequired,
    savedPipeline: PropTypes.object.isRequired,
    stageAdded: PropTypes.func.isRequired,
    copyToClipboard: PropTypes.func.isRequired,
    newPipeline: PropTypes.func.isRequired,
    clonePipeline: PropTypes.func.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired
  }

  handleSavedPipelinesOpen = () => {
    this.props.getSavedPipelines();
    this.props.savedPipelinesListToggle(1);
  }

  handleSavedPipelinesClose = () => {
    this.props.savedPipelinesListToggle(0);
  }

  /**
   * Renders the pipeline builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const clickHandler = this.props.savedPipeline.isListVisible
      ? this.handleSavedPipelinesClose
      : this.handleSavedPipelinesOpen;
    const addStageClassName = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-primary': true,
      [ styles['pipeline-builder-toolbar-add-stage-button'] ]: true
    });
    const openPipelinesClassName = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-default': true
    });

    const savePipelineClassName = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-default': true,
      [ styles['pipeline-builder-toolbar-save-pipeline-button'] ]: true
    });

    return (
      <div className={classnames(styles['pipeline-builder-toolbar'])}>
        <IconButton
          title="Toggle Saved Pipelines"
          className={openPipelinesClassName}
          iconClassName="fa fa-folder-open-o"
          clickHandler={clickHandler} />
        <div className={classnames(styles['pipeline-builder-toolbar-add-wrapper'])}>
          <TextButton
            text="Add Stage"
            className={addStageClassName}
            clickHandler={this.props.stageAdded} />
        </div>
        <TextButton
          text="Save Pipeline"
          className={savePipelineClassName}
          clickHandler={this.props.saveCurrentPipeline} />
        <DropdownButton bsStyle="default" title="..." noCaret pullRight>
          <MenuItem onClick={this.props.copyToClipboard}>Copy Pipeline to Clipboard</MenuItem>
          <MenuItem onClick={this.props.clonePipeline}>Clone Pipeline</MenuItem>
          <MenuItem onClick={this.props.newPipeline}>New Pipeline</MenuItem>
        </DropdownButton>
      </div>
    );
  }
}

export default PipelineBuilderToolbar;
