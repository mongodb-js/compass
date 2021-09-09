import React, { PureComponent } from 'react';
import styles from './splitter.module.less';

/**
 * Displays the splitter/separator for resizing.
 */
class Splitter extends PureComponent {
  static displayName = 'SplitterComponent';

  /**
   * Render global the separator bar.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div
        className={styles.splitter}
      />
    );
  }
}

export default Splitter;
