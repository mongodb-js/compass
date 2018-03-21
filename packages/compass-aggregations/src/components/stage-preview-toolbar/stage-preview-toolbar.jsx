import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './stage-preview-toolbar.less';

/**
 * The stage preview toolbar component.
 */
class StagePreviewToolbar extends PureComponent {
  static displayName = 'StagePreviewToolbar';
  static propTypes = {
    isEnabled: PropTypes.bool.isRequired,
    stageOperator: PropTypes.string
  }

  /**
   * Renders the stage preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const text = this.props.stageOperator && this.props.isEnabled
      ? `Sample of Documents after the ${this.props.stageOperator} stage`
      : null;
    return (
      <div className={classnames(styles['stage-preview-toolbar'])}>
        {text}
      </div>
    );
  }
}

export default StagePreviewToolbar;
