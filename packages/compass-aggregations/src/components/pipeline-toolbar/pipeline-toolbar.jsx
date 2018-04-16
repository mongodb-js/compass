import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import PipelineBuilderToolbar from 'components/pipeline-builder-toolbar';
import PipelinePreviewToolbar from 'components/pipeline-preview-toolbar';

import styles from './pipeline-toolbar.less';

/**
 * The toolbar component.
 */
class PipelineToolbar extends PureComponent {
  static displayName = 'ToolbarComponent';

  static propTypes = {
    savedPipelinesListToggle: PropTypes.func.isRequired,
    getSavedPipelines: PropTypes.func.isRequired,
    stageAdded: PropTypes.func.isRequired,
    newPipeline: PropTypes.func.isRequired,
    clonePipeline: PropTypes.func.isRequired,
    copyToClipboard: PropTypes.func.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired,
    savedPipeline: PropTypes.object.isRequired,
    nameChanged: PropTypes.func.isRequired,
    isModified: PropTypes.bool.isRequired,
    setIsModified: PropTypes.func.isRequired,
    name: PropTypes.string
  }

  /**
   * Renders the toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['pipeline-toolbar'])}>
        <PipelineBuilderToolbar
          savedPipelinesListToggle={this.props.savedPipelinesListToggle}
          getSavedPipelines={this.props.getSavedPipelines}
          savedPipeline={this.props.savedPipeline}
          clonePipeline={this.props.clonePipeline}
          newPipeline={this.props.newPipeline}
          copyToClipboard={this.props.copyToClipboard}
          saveCurrentPipeline={this.props.saveCurrentPipeline}
          isValid={this.props.savedPipeline.isNameValid}
          nameChanged={this.props.nameChanged}
          isModified={this.props.isModified}
          setIsModified={this.props.setIsModified}
          name={this.props.name} />
        <PipelinePreviewToolbar
          stageAdded={this.props.stageAdded}
          isModified={this.props.isModified} />
      </div>
    );
  }
}

export default PipelineToolbar;
