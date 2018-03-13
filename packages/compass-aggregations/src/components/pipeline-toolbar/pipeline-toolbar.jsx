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
    view: PropTypes.string.isRequired,
    stageAdded: PropTypes.func.isRequired,
    viewChanged: PropTypes.func.isRequired,
    copyToClipboard: PropTypes.func.isRequired,
    savePipelineModalToggle: PropTypes.func.isRequired,
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
          view={this.props.view}
          stageAdded={this.props.stageAdded}
          viewChanged={this.props.viewChanged}
          copyToClipboard={this.props.copyToClipboard}
          savePipelineModalToggle={this.props.savePipelineModalToggle} />
        <PipelinePreviewToolbar name={this.props.name} />
      </div>
    );
  }
}

export default PipelineToolbar;
