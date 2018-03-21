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
    stageAdded: PropTypes.func.isRequired,
    newPipeline: PropTypes.func.isRequired,
    clonePipeline: PropTypes.func.isRequired,
    copyToClipboard: PropTypes.func.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired,
    savedPipeline: PropTypes.object.isRequired,
    nameChanged: PropTypes.func.isRequired,
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
          stageAdded={this.props.stageAdded}
          clonePipeline={this.props.clonePipeline}
          newPipeline={this.props.newPipeline}
          copyToClipboard={this.props.copyToClipboard}
          saveCurrentPipeline={this.props.saveCurrentPipeline} />
        <PipelinePreviewToolbar
          isValid={this.props.savedPipeline.isNameValid}
          nameChanged={this.props.nameChanged}
          name={this.props.name} />
      </div>
    );
  }
}

export default PipelineToolbar;
