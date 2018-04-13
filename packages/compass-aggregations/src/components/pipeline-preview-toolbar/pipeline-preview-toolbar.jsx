import React, { PureComponent } from 'react';
import { TextButton } from 'hadron-react-buttons';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './pipeline-preview-toolbar.less';

/**
 * The pipeline preview toolbar component.
 */
class PipelinePreviewToolbar extends PureComponent {
  static displayName = 'PipelinePreviewToolbarComponent';

  static propTypes = {
    stageAdded: PropTypes.func.isRequired
  }

  /**
   * Renders the pipeline preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const addStageClassName = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-primary': true,
      [ styles['pipeline-preview-toolbar-add-stage-button'] ]: true
    });
    return (
      <div className={classnames(styles['pipeline-preview-toolbar'])}>
      <TextButton
        text="Add Stage"
        className={addStageClassName}
        clickHandler={this.props.stageAdded} />
      </div>
    );
  }
}

export default PipelinePreviewToolbar;
