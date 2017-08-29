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

    this.element = props.value;

    this._editors = initEditors(this.element);
  }

  componentDidMount() {
    this.unsubscribeAdded = this.handleAdded.bind(this);
    this.unsubscribeConverted = this.handleConverted.bind(this);
    this.unsubscribeEdited = this.handleEdited.bind(this);
    this.unsubscribeRemoved = this.handleRemoved.bind(this);
    this.unsubscribeReverted = this.handleReverted.bind(this);
    this.unsubscribeInvalid = this.handleInvalid.bind(this);

    this.element.on(Element.Events.Added, this.unsubscribeAdded);
    this.element.on(Element.Events.Converted, this.unsubscribeConverted);
    this.element.on(Element.Events.Edited, this.unsubscribeEdited);
    this.element.on(Element.Events.Removed, this.unsubscribeRemoved);
    this.element.on(Element.Events.Reverted, this.unsubscribeReverted);
    this.element.on(Element.Events.Invalid, this.unsubscribeInvalid);
  }

  /**
   * Unsubscribe from the events.
   */
  componentWillUnmount() {
    this.element.removeListener(Element.Events.Added, this.unsubscribeAdded);
    this.element.removeListener(Element.Events.Converted, this.unsubscribeConverted);
    this.element.removeListener(Element.Events.Edited, this.unsubscribeEdited);
    this.element.removeListener(Element.Events.Removed, this.unsubscribeRemoved);
    this.element.removeListener(Element.Events.Reverted, this.unsubscribeReverted);
    this.element.removeListener(Element.Events.Invalid, this.unsubscribeInvalid);
  }

  handleAdded() {
    console.log("handle added");
  }
  handleConverted() {
    console.log("handle converted");
  }
  handleRemoved() {
    console.log("handle removed");
  }
  handleReverted() {
    console.log("handle reverted");
  }
  handleInvalid() {
    console.log("handle invalid");
  }

  handleEdited() {
    console.log("handle edited");
    this.props.node.data.state = 'modified';
  }

  renderReadOnly() {
    const component = getComponent(this.props.value.currentType);
    return React.createElement(
      component,
      { type: this.props.value.currentType, value: this.props.value.currentValue }
    );
  }

  render() {
    return (
      <div className="table-cell">
        {this.renderReadOnly()}
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
