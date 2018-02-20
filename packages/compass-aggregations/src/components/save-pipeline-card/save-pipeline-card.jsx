import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './save-pipeline-card.less';

/**
 * Off canvas button component.
 */
class SavePipelineCard extends PureComponent {
  static displayName = 'SavePipelineCardComponent';

  static propTypes = {
    objectid: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }

  /**
   * Render a pipeline card.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div
        className={classnames(styles['save-pipeline-card'])}
        data-object-id={this.props.objectid}>
        <div className={classnames(styles['save-pipeline-card-title'])}>
          {this.props.name}
        </div>
      </div>
    );
  }
}

export default SavePipelineCard;
