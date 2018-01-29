import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './results.less';

/**
 * Displays pipeline results.
 */
class Results extends Component {
  static displayName = 'ResultsComponent';

  static propTypes = {
    results: PropTypes.object.isRequired
  }

  /**
   * Render the pipeline results.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles.results)}>
      </div>
    );
  }
}

export default Results;
