import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon } from '@mongodb-js/compass-components';

import styles from './input-documents-count.module.less';

/**
 * Display count of input documents.
 */
class InputDocumentsCount extends PureComponent {
  static displayName = 'InputDocumentsCountComponent';

  static propTypes = {
    count: PropTypes.number
  }

  /**
   * Render the input documents count component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['input-documents-count'])}>
        <Icon glyph="Database" size="small" />
        <div className={classnames(styles['input-documents-count-label'])}>
          {this.props.count ?? 'N/A'} Documents in the Collection
        </div>
      </div>
    );
  }
}

export default InputDocumentsCount;
