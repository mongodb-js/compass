import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import StageEditor from 'components/stage-editor';

import styles from './advanced-builder.less';

/**
 * Displays the advanced builder.
 */
class AdvancedBuilder extends PureComponent {
  static displayName = 'AdvancedBuilder';

  static propTypes = {
    stages: PropTypes.array.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageChanged: PropTypes.func.isRequired
  }

  /**
   * Render the advanced builder component.
   *
   * @returns {Component} The component.
   */
  render() {
    const stageEditors = this.props.stages.map((stage, i) => {
      return (
        <StageEditor
          stage={stage}
          index={i}
          serverVersion={this.props.serverVersion}
          key={i}
          stageChanged={this.props.stageChanged} />
      );
    });
    return (
      <div className={classnames(styles['advanced-builder'])}>
        {stageEditors}
      </div>
    );
  }
}

export default AdvancedBuilder;
