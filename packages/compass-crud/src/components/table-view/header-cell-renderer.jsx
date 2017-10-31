const React = require('react');
const PropTypes = require('prop-types');
const FontAwesome = require('react-fontawesome');

/**
  Custom cell renderer for the headers.
 */
class HeaderCellRenderer extends React.Component {

  constructor(props) {
    super(props);
  }

  renderPinnedIcon() {
    if (this.props.subtable === true) {
      return <FontAwesome className="fa-thumb-tack table-view-cell-header-icon" name="thumbtack" fixedWidth />;
    }
  }

  render() {
    if (this.props.hide) {
      return null;
    }
    let displayName = this.props.displayName;
    if (this.props.displayName === '$new') {
      displayName = 'New Field';
    }
    return (
      <div className="table-view-cell-header">
        <b>{displayName}</b> {this.props.bsonType}
        {this.renderPinnedIcon()}
      </div>
    );
  }
}

HeaderCellRenderer.propTypes = {
  displayName: PropTypes.any,
  bsonType: PropTypes.string,
  hide: PropTypes.bool,
  subtable: PropTypes.bool
};

HeaderCellRenderer.displayName = 'HeaderCellRenderer';

module.exports = HeaderCellRenderer;
