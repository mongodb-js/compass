import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Switch from 'react-ios-switch';

import styles from './toggle-stage.less';

/**
 * The toggle stage button.
 */
class ToggleStage extends PureComponent {
  static displayName = 'ToggleStageComponent';

  static propTypes = {
    stage: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    stageToggled: PropTypes.func.isRequired
  }

  /**
   * Handle stage toggled clicks.
   */
  onStageToggled = () => {
    this.props.stageToggled(this.props.index);
  }

  /**
   * Render the button component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['toggle-stage'])}>
        <Switch
          checked={this.props.stage.isEnabled}
          onChange={this.onStageToggled}
          className={classnames(styles['toggle-stage-button'])} />
      </div>
    );
  }
}

export default ToggleStage;
