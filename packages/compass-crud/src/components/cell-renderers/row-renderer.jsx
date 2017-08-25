const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');
// const util = require('util');

const CellRenderer = require('./cell-renderer');

/**
 * The cell renderer that renders an entire row.
 */
class RowRenderer extends React.Component {
  constructor(props) {
    super(props);
    props.api.selectAll();
  }

  /**
   * Get the cell to refresh. Return true if the refresh succeeded, otherwise
   * return false. If you return false, the grid will remove the component from
   * the DOM and create a new component in it's place with the new values.
   */
  refresh() {
  }

  render() {
    const cells = _.map(this.props.data, (key, value) => {
      return (
        <CellRenderer data={value} key={key}/>
      );
    });
    return (
      <div className="grid-columns">
        <ul>
          {cells}
        </ul>
      </div>
    );
  }
}

RowRenderer.propTypes = {
  api: PropTypes.any,
  data: PropTypes.any
};

RowRenderer.displayName = 'RowRenderer';

module.exports = RowRenderer;
