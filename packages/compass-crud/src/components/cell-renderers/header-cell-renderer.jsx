const React = require('react');
const PropTypes = require('prop-types');

/**
  Custom cell renderer for the headers. Right now it's empty, will grow as more
  features are added.
 */
class HeaderCellRenderer extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <span><b>{this.props.displayName}</b> {this.props.bsonType}</span>
    );
  }
}

HeaderCellRenderer.propTypes = {
  displayName: PropTypes.string.isRequired,
  bsonType: PropTypes.string.isRequired
};

HeaderCellRenderer.displayName = 'HeaderCellRenderer';

module.exports = HeaderCellRenderer;
