import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import IndexDefinitionType from '../index-definition-type';

import classnames from 'classnames';
import styles from './name-column.module.less';

/**
 * Component for the name column.
 */
class NameColumn extends PureComponent {
  static displayName = 'NameColumn';

  static propTypes = {
    index: PropTypes.object.isRequired,
  };

  /**
   * Render the name column.
   *
   * @returns {React.Component} The name column.
   */
  render() {
    return (
      <td className={classnames(styles['name-column'])}>
        <div className="index-definition">
          <div
            className={classnames(styles['name-column-name'])}
            data-test-id="name-column-name"
            title={this.props.index.name}
          >
            {this.props.index.name}
          </div>
          <IndexDefinitionType index={this.props.index} />
        </div>
      </td>
    );
  }
}

export default NameColumn;
