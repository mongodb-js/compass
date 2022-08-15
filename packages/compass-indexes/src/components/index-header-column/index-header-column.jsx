import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { css, cx, uiColors, spacing } from '@mongodb-js/compass-components';

import { DEFAULT, DESC, ASC } from '../../modules/indexes';

const headerStyles = css({
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
  paddingRight: spacing[4],
  paddingLeft: spacing[4],
});

const sortStyles = css({
  display: 'inline-block',
  color: uiColors.gray.base,
});

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

  /**
   * Render the index header column.
   *
   * @returns {React.Component} The index header column.
   */
  render() {
    return (
      <th
        data-test-id={this.props.dataTestId}
        onClick={this.handleIndexSort.bind(this)}
        className={headerStyles}
      >
        {this.props.name}
        {this.props.sortColumn === this.props.name && (
          <i className={cx(sortStyles, `fa fa-fw ${this.props.sortOrder}`)} />
        )}
      </th>
    );
  }
}

export default IndexHeaderColumn;
