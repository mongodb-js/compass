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
    isEnabled: PropTypes.bool.isRequired,
    index: PropTypes.number.isRequired,
    runStage: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    setIsModified: PropTypes.func.isRequired
  }

  /**
   * Handle stage toggled clicks.
   */
  onStageToggled = () => {
    this.props.stageToggled(this.props.index);
    this.props.setIsModified(true);
    this.props.runStage(this.props.index);
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
          checked={this.props.isEnabled}
          onChange={this.onStageToggled}
          className={classnames(styles['toggle-stage-button'])}
          onColor="rgb(19, 170, 82)"
          style={{ backgroundColor: 'rgb(255,255,255)'}}
          />
      </div>
    );
  }
}

export default ToggleStage;
