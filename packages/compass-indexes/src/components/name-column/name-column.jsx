import React from 'react';
import PropTypes from 'prop-types';
import IndexDefinition from 'components/index-definition';

/**
 * Component for the name column.
 */
class NameColumn extends React.Component {

  /**
   * Render the name column.
   *
   * @returns {React.Component} The name column.
   */
  render() {
    return (
      <td className="name-column">
        <IndexDefinition index={this.props.index} />
      </td>
    );
  }
}

NameColumn.displayName = 'NameColumn';

NameColumn.propTypes = {
  index: PropTypes.object.isRequired
};

export default NameColumn;
