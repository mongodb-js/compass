import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import AddStageButton from 'components/add-stage-button';

import styles from './add-stage.less';

/**
 * Display a card with an add stage button.
 */
class AddStage extends PureComponent {
  static displayName = 'AddStageComponent';

  static propTypes = {
    stageAdded: PropTypes.func.isRequired
  }

  /**
   * Render the stage component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['add-stage'])}>
        <AddStageButton stageAdded={this.props.stageAdded} />
      </div>
    );
  }
}

export default AddStage;
