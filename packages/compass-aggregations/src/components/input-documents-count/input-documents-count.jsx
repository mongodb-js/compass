import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './input-documents-count.less';

/**
 * Display count of input documents.
 */
class InputDocumentsCount extends PureComponent {
  static displayName = 'InputDocumentsCountComponent';

  static propTypes = {
    count: PropTypes.number.isRequired
  }

  /**
   * Render the input documents count component.
   *
   * @returns {Component} The component.
   */
  render() {
    const iconClassName = classnames({
      'fa': true,
      'fa-database': true,
      [ styles['input-documents-count-db'] ]: true
    });
    return (
      <div className={classnames(styles['input-documents-count'])}>
        <i className={iconClassName} aria-hidden />
        <div className={classnames(styles['input-documents-count-label'])}>
          {this.props.count} Documents in the Collection
        </div>
      </div>
    );
  }
}

export default InputDocumentsCount;
