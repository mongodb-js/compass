import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { css } from '@mongodb-js/compass-components';
import IndexHeaderColumn from '../index-header-column';

const containerStyles = css({
  textAlign: 'left',
  th: {
    padding: '12px 24px',
  },
});

/**
 * Component for the index header.
 */
class IndexHeader extends PureComponent {
  static displayName = 'IndexHeader';
  static propTypes = {
    isWritable: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    indexes: PropTypes.array.isRequired,
    sortOrder: PropTypes.string.isRequired,
    sortColumn: PropTypes.string.isRequired,
    sortIndexes: PropTypes.func.isRequired,
  };

  /**
   * Render the index header.
   *
   * @returns {React.Component} The index header.
   */
  render() {
    return (
      <thead className={containerStyles}>
        <tr>
          <IndexHeaderColumn
            dataTestId="index-header-name"
            name="Name and Definition"
            sortOrder={this.props.sortOrder}
            sortColumn={this.props.sortColumn}
            sortIndexes={this.props.sortIndexes}
            indexes={this.props.indexes}
          />
          <IndexHeaderColumn
            dataTestId="index-header-type"
            name="Type"
            sortOrder={this.props.sortOrder}
            sortColumn={this.props.sortColumn}
            sortIndexes={this.props.sortIndexes}
            indexes={this.props.indexes}
          />
          <IndexHeaderColumn
            dataTestId="index-header-size"
            name="Size"
            sortOrder={this.props.sortOrder}
            sortColumn={this.props.sortColumn}
            sortIndexes={this.props.sortIndexes}
            indexes={this.props.indexes}
          />
          <IndexHeaderColumn
            dataTestId="index-header-usage"
            name="Usage"
            sortOrder={this.props.sortOrder}
            sortColumn={this.props.sortColumn}
            sortIndexes={this.props.sortIndexes}
            indexes={this.props.indexes}
          />
          <IndexHeaderColumn
            dataTestId="index-header-properties"
            name="Properties"
            sortOrder={this.props.sortOrder}
            sortColumn={this.props.sortColumn}
            sortIndexes={this.props.sortIndexes}
            indexes={this.props.indexes}
          />
          {!this.props.isReadonly && this.props.isWritable ? <th /> : null}
        </tr>
      </thead>
    );
  }
}

export default IndexHeader;
