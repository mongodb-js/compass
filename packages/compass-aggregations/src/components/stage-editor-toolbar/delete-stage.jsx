import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './delete-stage.module.less';

/**
 * The delete stage button.
 */
class DeleteStage extends PureComponent {
  static displayName = 'DeleteStageComponent';

  static propTypes = {
    index: PropTypes.number.isRequired,
    stageDeleted: PropTypes.func.isRequired,
  };

  /**
   * Handle stage deleted clicks.
   */
  onStageDeleted = () => {
    this.props.stageDeleted(this.props.index);
  };

  /**
   * Render the button component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['delete-stage'])}>
        <button
          data-testid="delete-stage"
          type="button"
          title="Delete Stage"
          className="btn btn-default btn-xs"
          onClick={this.onStageDeleted}>
          <i className="fa fa-trash-o" aria-hidden />
        </button>
      </div>
    );
  }
}

export default DeleteStage;
