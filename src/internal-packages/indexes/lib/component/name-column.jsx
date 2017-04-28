const React = require('react');
const PropTypes = require('prop-types');
const IndexDefinition = require('./index-definition');

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

module.exports = NameColumn;
