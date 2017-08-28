const React = require('react');
const PropTypes = require('prop-types');
// const _ = require('lodash');
const util = require('util');
const EditableValue = require('../editable-value');

/**
 * The renderer that renders a cell.
 */
class CellRenderer extends React.Component {
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
    // return (
    //   <div className="cell">
    //     {JSON.stringify(this.props.value.value)}
    //   </div>
    // );
    return (
      <EditableValue element={this.props.value} isFocused={false} />
    );
  }
}

CellRenderer.propTypes = {
  api: PropTypes.any,
  value: PropTypes.any
};

CellRenderer.displayName = 'CellRenderer';

module.exports = CellRenderer;
