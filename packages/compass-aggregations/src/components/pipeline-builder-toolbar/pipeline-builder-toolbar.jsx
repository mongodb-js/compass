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
    stageAdded: PropTypes.func.isRequired,
    viewChanged: PropTypes.func.isRequired,
    copyToClipboard: PropTypes.func.isRequired,
    savePipelineModalToggle: PropTypes.func.isRequired
  }

  onSavePipelineModalToggle = () => {
    this.props.savePipelineModalToggle(1);
  };

  /**
   * Renders the pipeline builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
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
          clickHandler={this.onSavePipelineModalToggle} />
        <IconButton
          title="Save Pipeline"
          className={savePipelineClassName}
          iconClassName="fa fa-save"
          clickHandler={this.onSavePipelineModalToggle} />
      </div>
    );
  }
}

export default PipelineBuilderToolbar;
