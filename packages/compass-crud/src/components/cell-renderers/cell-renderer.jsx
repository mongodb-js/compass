const React = require('react');
const PropTypes = require('prop-types');
// const _ = require('lodash');
const util = require('util');
const EditableValue = require('../editable-value');
const getComponent = require('hadron-react-bson');

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

  renderEditable() {
    return (
      <EditableValue element={this.props.value} isFocused={false} />
    );
  }

  renderReadOnly() {
    const component = getComponent(this.props.value.currentType);
    return React.createElement(
      component,
      { type: this.props.value.currentType, value: this.props.value.currentValue }
    );
  }

  render() {
    const element = this.props.editable ? this.renderEditable() : this.renderReadOnly();
    return (
      <div className="table-cell">
        {element}
      </div>
    );
  }
}

CellRenderer.propTypes = {
  api: PropTypes.any,
  value: PropTypes.any,
  isEditable: PropTypes.bool.isRequired
};

CellRenderer.displayName = 'CellRenderer';

module.exports = CellRenderer;
