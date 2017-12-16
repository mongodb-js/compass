import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import Stage from 'components/stage';
import AddStage from 'components/add-stage';

import styles from './advanced-builder.less';

/**
 * Displays the advanced builder.
 */
@DragDropContext(HTML5Backend)
class AdvancedBuilder extends PureComponent {
  static displayName = 'AdvancedBuilder';

  static propTypes = {
    stages: PropTypes.array.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageAdded: PropTypes.func.isRequired,
    stageChanged: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    stageMoved: PropTypes.func.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired
  }

  /**
   * Render the advanced builder component.
   *
   * @returns {Component} The component.
   */
  render() {
    const stages = this.props.stages.map((stage, i) => {
      return (
        <Stage {...this.props} stage={stage} index={i} key={stage.id} />
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
