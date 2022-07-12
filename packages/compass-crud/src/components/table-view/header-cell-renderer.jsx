import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
  Custom cell renderer for the headers.
 */
class HeaderCellRenderer extends React.Component {
  constructor(props) {
    super(props);
  }

  refresh() {
    return true;
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
      <div
        className={classNames('table-view-cell-header', {
          'table-view-cell-header-subtable-objectid':
            this.props.subtable === true,
        })}
      >
        <b>{displayName}</b> {this.props.bsonType}
      </div>
    );
  }
}

HeaderCellRenderer.propTypes = {
  displayName: PropTypes.any,
  bsonType: PropTypes.string,
  hide: PropTypes.bool,
  subtable: PropTypes.bool,
};

HeaderCellRenderer.displayName = 'HeaderCellRenderer';

export default HeaderCellRenderer;
