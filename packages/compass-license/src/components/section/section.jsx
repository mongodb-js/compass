import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './section.less';

class Section extends Component {
  static displayName = 'SectionComponent';

  static propTypes = {
    title: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired
  };

  /**
   * Render the Section component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['section-body-item'])}>
        <span className={classnames(styles['section-body-item-title'])}>
          {this.props.index + 1}. {this.props.title}.
        </span>
        <span className={classnames(styles['section-body-item-text'])}>
          {this.props.text}
        </span>
      </div>
    );
  }
}

export default Section;
export { Section };
