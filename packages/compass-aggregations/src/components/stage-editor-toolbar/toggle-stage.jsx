import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'hadron-react-components';
import { Toggle } from '@mongodb-js/compass-components';

import styles from './toggle-stage.module.less';

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
  };

  /**
   * Handle stage toggled clicks.
   */
  onStageToggled = () => {
    this.props.stageToggled(this.props.index);
    this.props.setIsModified(true);
    this.props.runStage(this.props.index, true /* force execute */);
  };

  /**
   * Render the button component.
   *
   * @returns {Component} The component.
   */
  render() {
    const TOOLTIP = this.props.isEnabled
      ? 'Exclude stage from pipeline'
      : 'Include stage in pipeline';
    return (
      <div
        className={styles['toggle-stage']}
        data-for="toggle-stage"
        data-tip={TOOLTIP}
        data-place="top"
      >
        <Toggle
          id="toggle-stage-button"
          checked={this.props.isEnabled}
          onChange={this.onStageToggled}
          className={styles['toggle-stage-button']}
          aria-label={TOOLTIP}
          size="small"
        />
        <Tooltip id="toggle-stage" />
      </div>
    );
  }
}

export default ToggleStage;
