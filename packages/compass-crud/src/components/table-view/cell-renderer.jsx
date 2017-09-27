const React = require('react');
const PropTypes = require('prop-types');
const getComponent = require('hadron-react-bson');
const { Element } = require('hadron-document');

const Actions = require('../../actions');

const initEditors = require('../editor/');

// const util = require('util');

/**
 * The BEM base style name for the cell.
 */
const BEM_BASE = 'table-view-cell';

/**
 * The BEM base style name for the value.
 */
const VALUE_BASE = 'editable-element';

/**
 * The document value class.
 */
const VALUE_CLASS = 'editable-element-value';

/**
 * Invalid value class.
 */
const INVALID_VALUE = `${VALUE_CLASS}-is-invalid-type`;

/**
 * The added constant.
 */
const ADDED = 'is-added';

/**
 * The edited constant.
 */
const EDITED = 'is-edited';

/**
 * The empty constant.
 */
const EMPTY = 'is-empty';

/**
 * The invalid constant.
 */
const INVALID = 'is-invalid';

/**
 * The deleted constant.
 */
const DELETED = 'is-deleted';
/**
 * The button button.
 */
const BUTTON_CLASS = 'table-view-cell-circle-button';


/**
 * The custom cell renderer that renders a cell in the table view.
 */
class CellRenderer extends React.Component {
  constructor(props) {
    super(props);
    props.api.selectAll();

    this.isEmpty = props.value === undefined;
    this.isDeleted = false;
    this.element = props.value;

    this._editors = initEditors(this.element);
  }

  componentDidMount() {
    if (!this.isEmpty) {
      this.subscribeElementEvents();
    }
  }

  componentWillUnmount() {
    if (!this.isEmpty) {
      this.unsubscribeElementEvents();
    }
  }

  subscribeElementEvents() {
    this.unsubscribeReverted = this.handleReverted.bind(this);
    this.unsubscribeEdited = this.handleEdited.bind(this);

    this.element.on(Element.Events.Reverted, this.unsubscribeReverted);
    this.element.on(Element.Events.Edited, this.unsubscribeEdited);
  }

  unsubscribeElementEvents() {
    this.element.removeListener(Element.Events.Reverted, this.unsubscribeReverted);
    this.element.removeListener(Element.Events.Edited, this.unsubscribeEdited);
  }

  handleReverted() {
    this.forceUpdate();
  }

  handleEdited() {
    // TODO: set for consistency, state is only really used for update rows.
    this.props.node.data.state = 'modified';
  }

  handleUndo(event) {
    event.stopPropagation();
    const oid = this.props.node.data.hadronDocument.getId().toString();
    if (this.element.isAdded()) {
      this.isDeleted = true;
      Actions.elementRemoved(this.element.currentKey, oid, true);
    } else if (this.element.isRemoved()) {
      Actions.elementAdded(this.element.currentKey, this.element.currentType, oid);
    } else {
      Actions.elementTypeChanged(this.element.currentKey, this.element.type, oid);
    }
    this.element.revert();
  }

  handleExpand(event) {
    event.stopPropagation();
  }

  handleClicked() {
    if (this.props.node.data.state === 'editing' || this.props.node.data.state === 'cloned') {
      this.props.api.startEditingCell({
        rowIndex: this.props.node.rowIndex,
        colKey: this.props.column.getColId()
      });
    }
  }

  renderInvalidCell() {
    let valueClass = `${VALUE_CLASS}-is-${this.element.currentType.toLowerCase()}`;
    valueClass = `${valueClass} ${INVALID_VALUE}`;

    /* Return internal div because invalid cells should only hightlight text? */

    return (
      <div className={valueClass}>
        {this.element.currentValue}
      </div>
    );
  }

  renderValidCell() {
    let className = VALUE_BASE;
    let element = '';
    if (this.element.isAdded()) {
      className = `${className} ${VALUE_BASE}-${ADDED}`;
    } else if (this.element.isEdited()) {
      className = `${className} ${VALUE_BASE}-${EDITED}`;
    }

    if (this.element.currentType === 'Object') {
      element = `{${this.element.elements.size}}`;
    } else if (this.element.currentType === 'Array') {
      element = `[${this.element.elements.size}]`;
    } else {
      const component = getComponent(this.element.currentType);
      element = React.createElement(
        component,
        {type: this.props.value.currentType, value: this.element.currentValue}
      );
    }

    return (
      <div className={className}>
        {element}
      </div>
    );
  }

  renderUndo(canUndo, canExpand) {
    let undoButtonClass = `${BUTTON_CLASS}`;
    if (canUndo && canExpand) {
      undoButtonClass = `${undoButtonClass} ${undoButtonClass}-left`;
    }

    if (!canUndo) {
      return null;
    }
    return (
      <div className={`${undoButtonClass}`} onClick={this.handleUndo.bind(this)}>
        <span className={'fa fa-rotate-left'} aria-hidden />
      </div>
    );
  }

  renderExpand(canExpand) {
    if (!canExpand) {
      return null;
    }
    return (
      <div className={'table-view-cell-circle-button'} onClick={this.handleExpand.bind(this)}>
        <span className={'fa fa-expand'} aria-hidden />
      </div>
    );
  }

  render() {
    let element;
    let className = BEM_BASE;
    let canUndo = false;
    let canExpand = false;

    if (this.isEmpty || this.isDeleted) {
      element = 'No field';
      className = `${className}-${EMPTY}`;
    } else if (!this.element.isCurrentTypeValid()) {
      element = this.renderInvalidCell();
      className = `${className}-${INVALID}`;
      canUndo = true;
    } else if (this.element.isRemoved()) {
      element = 'Deleted field';
      className = `${className}-${DELETED}`;
      canUndo = true;
    } else {
      element = this.renderValidCell();
      if (this.element.isEdited()) {
        className = `${className}-${EDITED}`;
        canUndo = true;
      } else if (this.element.isAdded()) {
        className = `${className}-${ADDED}`;
        canUndo = true;
      }
      canExpand = (this.element.currentType === 'Object' || this.element.currentType === 'Array');
    }

    return (
      <div className={className} onClick={this.handleClicked.bind(this)}>
        {this.renderUndo(canUndo, canExpand)}
        {this.renderExpand(canExpand)}
        {element}
      </div>
    );
  }
}

CellRenderer.propTypes = {
  api: PropTypes.any,
  value: PropTypes.any,
  node: PropTypes.any,
  column: PropTypes.any
};

CellRenderer.displayName = 'CellRenderer';

module.exports = CellRenderer;
