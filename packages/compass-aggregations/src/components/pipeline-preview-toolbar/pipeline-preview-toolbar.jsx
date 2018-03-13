import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './pipeline-preview-toolbar.less';

/**
 * The pipeline preview toolbar component.
 */
class PipelinePreviewToolbar extends PureComponent {
  static displayName = 'PipelinePreviewToolbarComponent';
  static propTypes = {
    name: PropTypes.string
  }

  /**
   * Renders the pipeline preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['pipeline-preview-toolbar'])}>
        {this.props.name}
      </div>
    );
  }
}

export default PipelinePreviewToolbar;
