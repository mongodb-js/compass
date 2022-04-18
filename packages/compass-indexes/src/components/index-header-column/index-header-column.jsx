import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';
import styles from './index-header-column.module.less';

import { DEFAULT, DESC, ASC } from '../../modules/indexes';

/**
 * Component for an index header column.
 */
class IndexHeaderColumn extends PureComponent {
  static displayName = 'IndexHeaderColumn';
  static propTypes = {
    indexes: PropTypes.array.isRequired,
    sortOrder: PropTypes.string.isRequired,
    sortColumn: PropTypes.string.isRequired,
    dataTestId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    sortIndexes: PropTypes.func.isRequired,
  };

  /**
   * Handle the index sort click.
   *
   * @param {Event} evt - The event.
   */
  handleIndexSort(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    let order;
    if (this.props.sortColumn === this.props.name) {
      order = this.props.sortOrder === ASC ? DESC : ASC;
    } else {
      order = this.props.sortColumn === DEFAULT ? ASC : DESC;
    }
    this.props.sortIndexes(this.props.indexes, this.props.name, order);
  }

  _renderClassName() {
    const active = this.props.sortColumn === this.props.name ? '-active' : '';
    return classnames(styles[`index-header-column${active}`]);
  }

  /**
   * Render the index header column.
   *
   * @returns {React.Component} The index header column.
   */
  render() {
    return (
      <th
        data-test-id={this.props.dataTestId}
        className={this._renderClassName()}
        onClick={this.handleIndexSort.bind(this)}
      >
        {this.props.name}
        <i
          className={classnames(
            styles['index-header-column-sort'],
            `fa fa-fw ${this.props.sortOrder}`
          )}
        />
      </th>
    );
  }
}

export default IndexHeaderColumn;
