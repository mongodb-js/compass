const React = require('react');
const PropTypes = require('prop-types');
// const _ = require('lodash');
const util = require('util');
const EditableValue = require('../editable-value');
const getComponent = require('hadron-react-bson');
const { Element } = require('hadron-document');
const initEditors = require('../editor/');

/**
 * The custom cell renderer that renders a cell in the table view.
 */
class CellRenderer extends React.Component {
  constructor(props) {
    super(props);
    props.api.selectAll();

    this.element = this.props.value;

    this._editors = initEditors(this.element);

    // this.unsubscribeAdded = this.handleExpand.bind(this);
    // this.unsubscribeConverted = this.handleExpand.bind(this);
    // this.unsubscribeEdited = this.handleChange.bind(this);
    // this.unsubscribeRemoved = this.handleChange.bind(this);
    // this.unsubscribeReverted = this.handleChange.bind(this);
    // this.unsubscribeInvalid = this.handleChange.bind(this);
    //
    // this.element.on(Element.Events.Added, this.unsubscribeAdded);
    // this.element.on(Element.Events.Converted, this.unsubscribeConverted);
    // this.element.on(Element.Events.Edited, this.unsubscribeEdited);
    // this.element.on(Element.Events.Removed, this.unsubscribeRemoved);
    // this.element.on(Element.Events.Reverted, this.unsubscribeReverted);
    // this.element.on(Element.Events.Invalid, this.unsubscribeInvalid);
  }

  /**
   * Unsubscribe from the events.
   */
  componentWillUnmount() {
    // this.element.removeListener(Element.Events.Added, this.unsubscribeAdded);
    // this.element.removeListener(Element.Events.Converted, this.unsubscribeConverted);
    // this.element.removeListener(Element.Events.Edited, this.unsubscribeEdited);
    // this.element.removeListener(Element.Events.Removed, this.unsubscribeRemoved);
    // this.element.removeListener(Element.Events.Reverted, this.unsubscribeReverted);
    // this.element.removeListener(Element.Events.Invalid, this.unsubscribeInvalid);
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
    // const element = this.props.editable ? this.renderEditable() : this.renderReadOnly();
    const element = this.renderReadOnly();
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
