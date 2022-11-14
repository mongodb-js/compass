import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { removeStage } from '../../modules/pipeline-builder/stage-editor';

import styles from './delete-stage.module.less';

/**
 * The delete stage button.
 */
export class DeleteStage extends PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    onStageDeleteClick: PropTypes.func.isRequired
  };

  /**
   * Handle stage deleted clicks.
   */
  onStageDeleted = () => {
    this.props.onStageDeleteClick(this.props.index);
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

export default connect(null, { onStageDeleteClick: removeStage })(DeleteStage);
