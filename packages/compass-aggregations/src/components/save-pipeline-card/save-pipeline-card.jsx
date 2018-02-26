import RestoreButton from 'components/restore-pipeline-button';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './save-pipeline-card.less';

/**
 * saved pipelines card
 */
class SavePipelineCard extends PureComponent {
  static displayName = 'SavePipelineCardComponent';

  static propTypes = {
    restorePipelineModalToggle: PropTypes.func.isRequired,
    restorePipelineObjectID: PropTypes.func.isRequired,
    objectID: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }

  state = {
    isVisible: false
  }

  handleMouseMovement = () => {
    this.setState({ isVisible: !this.state.isVisible });
  }

  restoreClickHandler = () => {
    this.props.restorePipelineObjectID(this.props.objectID);
    this.props.restorePipelineModalToggle(1);
  }

  /**
   * Render a pipeline card.
   *
   * @returns {Component} The component.
   */
  render() {
    const openView = this.state.isVisible ? <RestoreButton clickHandler={this.restoreClickHandler}/> : null;
    return (
      <div
        className={classnames(styles['save-pipeline-card'])}
        onMouseEnter={this.handleMouseMovement}
        onMouseLeave={this.handleMouseMovement}
        data-pipeline-object-id={this.props.objectID}>
        <div className={classnames(styles['save-pipeline-card-title'])}>
          {this.props.name}
        </div>
        { openView }
      </div>
    );
  }
}

export default SavePipelineCard;
