import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styles from './splitter.less';

/**
 * Displays the splitter/separator for resizing.
 */
class Splitter extends PureComponent {
  static displayName = 'SplitterComponent';

  static propTypes = {
    isCollationExpanded: PropTypes.bool
  };

  static defaultProps = {
    isCollationExpanded: false
  };

  /**
   * Render global the separator bar.
   *
   * @returns {Component} The component.
   */
  render() {
    if (this.props.isCollationExpanded) {
      return (
        <div
          key="splitter"
          className={styles['splitter-expanded']}
        />
      );
    }
    return <div key="splitter" className={styles.splitter} />;
  }
}

export default Splitter;
