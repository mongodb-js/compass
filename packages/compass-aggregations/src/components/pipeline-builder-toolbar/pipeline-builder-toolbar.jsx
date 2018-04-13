import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TextButton, IconButton } from 'hadron-react-buttons';

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
      'btn-default': true,
      [ styles['pipeline-builder-toolbar-add-stage-button'] ]: true
    });
    const copyToClipboardClassName = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-default': true,
      [ styles['pipeline-builder-toolbar-copy-to-clipboard-button'] ]: true
    });
    const savePipelineClassName = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-default': true,
      [ styles['pipeline-builder-toolbar-save-state'] ]: true
    });

    return (
      <div className={classnames(styles['pipeline-builder-toolbar'])}>
        <IconButton
          title="Toggle Saved Pipelines"
          className={savePipelineClassName}
          iconClassName="fa fa-folder-open-o"
          clickHandler={clickHandler} />
        <div className={classnames(styles['pipeline-builder-toolbar-add-wrapper'])}>
          <TextButton
            text="Add Stage"
            className={addStageClassName}
            clickHandler={this.props.stageAdded} />
        </div>
        <IconButton
          title="Copy to Clipboard"
          className={copyToClipboardClassName}
          iconClassName="fa fa-clipboard"
          clickHandler={this.props.copyToClipboard} />
        <IconButton
          title="New Pipeline"
          className={savePipelineClassName}
          iconClassName="fa fa-file-o"
          clickHandler={this.props.newPipeline} />
        <IconButton
          title="Clone Pipeline"
          className={savePipelineClassName}
          iconClassName="fa fa-clone"
          clickHandler={this.props.clonePipeline} />
        <IconButton
          title="Save Pipeline"
          className={savePipelineClassName}
          iconClassName="fa fa-save"
          clickHandler={this.props.saveCurrentPipeline} />
      </div>
    );
  }
}

export default PipelineBuilderToolbar;
