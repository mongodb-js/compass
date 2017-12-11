import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Stage from 'components/stage';
import AddStage from 'components/add-stage';

import styles from './advanced-builder.less';

/**
 * Displays the advanced builder.
 */
class AdvancedBuilder extends PureComponent {
  static displayName = 'AdvancedBuilder';

  static propTypes = {
    stages: PropTypes.array.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageAdded: PropTypes.func.isRequired,
    stageChanged: PropTypes.func.isRequired
  }

  /**
   * Render the advanced builder component.
   *
   * @returns {Component} The component.
   */
  render() {
    const stages = this.props.stages.map((stage, i) => {
      return (
        <Stage
          stage={stage}
          index={i}
          serverVersion={this.props.serverVersion}
          key={i}
          stageChanged={this.props.stageChanged} />
      );
    });
    return (
      <div className={classnames(styles['advanced-builder'])}>
        {stages}
        <AddStage stageAdded={this.props.stageAdded} />
      </div>
    );
  }
}

export default AdvancedBuilder;
