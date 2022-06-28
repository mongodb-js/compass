import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import FontAwesome from 'react-fontawesome';

import styles from './non-genuine-warning-pill.module.less';

/**
 * The non genuine warning pill.
 */
class NonGenuineWarningPill extends PureComponent {
  static displayName = 'NonGenuineWarningPill';
  static propTypes = {
    isGenuineMongoDB: PropTypes.bool.isRequired
  }

  /**
   * Render the component.
   *
   * @returns {Component} The component.
   */
  render() {
    if (this.props.isGenuineMongoDB) {
      return null;
    }
    return (
      <div className={styles['non-genuine-warning-pill']}>
        <div className={styles['non-genuine-warning-pill-text']}>
          <FontAwesome name="exclamation-circle"/>
          &nbsp;NON-GENUINE MONGODB
        </div>
      </div>
    );
  }
}

export default NonGenuineWarningPill;
