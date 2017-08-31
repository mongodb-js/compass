const React = require('react');
const PropTypes = require('prop-types');
// const _ = require('lodash');
const util = require('util');
const getComponent = require('hadron-react-bson');
const { Element } = require('hadron-document');
const initEditors = require('../editor/');
const { Tooltip } = require('hadron-react-components');

/**
 * The BEM base style name for the element.
 */
const BEM_BASE = 'editable-element';
/**
 * The document value class.
 */
const VALUE_CLASS = 'editable-element-value';

/**
 * Invalid type class.
 */
const INVALID = `${VALUE_CLASS}-is-invalid-type`;

/**
 * The added constant.
 */
const ADDED = 'is-added';

/**
 * The edited constant.
 */
const EDITED = 'is-edited';

/**
 * The editing constant.
 */
const EDITING = 'is-editing';

/**
 * The field limit.
 */
const FIELD_LIMIT = 30;

/**
 * The removed constant.
 */
const REMOVED = 'is-removed';


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
    //TODO: set for consistency, state is only really used for update rows.
    console.log("handle edited");
    this.props.node.data.state = 'modified';
  }

  /**
   * Get the style for the element component.
   *
   * @param {String} base - The base style.
   *
   * @returns {String} The element style.
   */
  style(base = BEM_BASE) {
    let style = base;
    if (this.element.isAdded()) {
      style = style.concat(` ${base}-${ADDED}`);
    } else if (this.element.isEdited()) {
      style = style.concat(` ${base}-${EDITED}`);
    } else if (this.element.isRemoved()) {
      style = style.concat(` ${base}-${REMOVED}`);
    }
    return style;
  }

  renderInvalidCell() {
    let valueClass = `${VALUE_CLASS}-is-${this.element.currentType.toLowerCase()}`;
    valueClass = `${valueClass} ${INVALID}`;
    return (
      <div className="table-cell">
        <div className={valueClass}>
          {this.element.currentValue}
        </div>
      </div>
    )
  }

  render() {
    if (!this.element.isCurrentTypeValid()) {
      return this.renderInvalidCell();
    }

    const component = getComponent(this.element.currentType);
    const element = React.createElement(
      component,
      { type: this.props.value.currentType, value: this.element.currentValue }
    );

    return (
      <div className="table-cell">
        <div className={this.style()}>
          {element}
        </div>
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
