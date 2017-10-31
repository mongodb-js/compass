const React = require('react');
const PropTypes = require('prop-types');

/**
 Custom cell renderer for the row numbers. Required because we can't rely on
 the ag-cell-last-left-pinned CSS class because on nested views the ObjectId
 is the last pinned column.
 */
class RowNumberRenderer extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="table-view-cell-row-number">
        {this.props.value}
      </div>
    );
  }
}

RowNumberRenderer.propTypes = {
  value: PropTypes.any
};

RowNumberRenderer.displayName = 'RowNumberRenderer';

module.exports = RowNumberRenderer;
