import React from 'react';
import PropTypes from 'prop-types';
import { BSONValue, Icon } from '@mongodb-js/compass-components';
import { Element } from 'hadron-document';

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
 * The uneditable constant.
 */
const UNEDITABLE = 'is-uneditable';

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

    this.isEmpty = props.value === undefined || props.value === null;
    this.isDeleted = false;
    this.element = props.value;

    /* Can't get the editable() function from here, so have to reevaluate */
    this.editable = true;
    if (props.context.path.length > 0 && props.column.getColId() !== '$_id') {
      const parent = props.node.data.hadronDocument.getChild(
        props.context.path
      );
      if (
        !parent ||
        (props.parentType && parent.currentType !== props.parentType)
      ) {
        this.editable = false;
      } else if (parent.currentType === 'Array') {
        let maxKey = 0;
        if (parent.elements.lastElement) {
          maxKey = parent.elements.lastElement.currentKey + 1;
        }
        if (props.column.getColId() > maxKey) {
          this.editable = false;
        }
      }
    }
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
    this.unsubscribeAdded = this.handleElementEvent.bind(this);
    this.unsubscribeConverted = this.handleElementEvent.bind(this);
    this.unsubscribeEdited = this.handleElementEvent.bind(this);
    this.unsubscribeReverted = this.handleElementEvent.bind(this);

    this.element.on(Element.Events.Added, this.unsubscribeAdded);
    this.element.on(Element.Events.Converted, this.unsubscribeConverted);
    this.element.on(Element.Events.Edited, this.unsubscribeEdited);
    this.element.on(Element.Events.Reverted, this.unsubscribeReverted);
  }

  unsubscribeElementEvents() {
    this.element.removeListener(Element.Events.Added, this.unsubscribeAdded);
    this.element.removeListener(
      Element.Events.Converted,
      this.unsubscribeConverted
    );
    this.element.removeListener(Element.Events.Edited, this.unsubscribeEdited);
    this.element.removeListener(
      Element.Events.Reverted,
      this.unsubscribeReverted
    );
  }

  handleElementEvent() {
    this.forceUpdate();
  }

  handleUndo(event) {
    event.stopPropagation();
    const oid = this.props.node.data.hadronDocument.getStringId();
    if (this.element.isAdded()) {
      this.isDeleted = true;
      const isArray =
        !this.element.parent.isRoot() &&
        this.element.parent.currentType === 'Array';
      this.props.elementRemoved(this.element.currentKey, oid, isArray);
    } else if (this.element.isRemoved()) {
      this.props.elementAdded(
        this.element.currentKey,
        this.element.currentType,
        oid
      );
    } else {
      this.props.elementTypeChanged(
        this.element.currentKey,
        this.element.type,
        oid
      );
    }
    this.element.revert();
  }

  handleDrillDown(event) {
    event.stopPropagation();
    this.props.drillDown(this.props.node.data.hadronDocument, this.element);
  }

  handleClicked() {
    if (this.props.node.data.state === 'editing') {
      this.props.api.startEditingCell({
        rowIndex: this.props.node.rowIndex,
        colKey: this.props.column.getColId(),
      });
    }
  }

  refresh() {
    return true;
  }

  renderInvalidCell() {
    let valueClass = `${VALUE_CLASS}-is-${this.element.currentType.toLowerCase()}`;
    valueClass = `${valueClass} ${INVALID_VALUE}`;

    /* Return internal div because invalid cells should only hightlight text? */

    return <div className={valueClass}>{this.element.currentValue}</div>;
  }

  getLength() {
    if (this.element.currentType === 'Object') {
      return Object.keys(this.element.generateObject()).length;
    }
    if (this.element.currentType === 'Array') {
      return this.element.elements.size;
    }
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
      element = `{} ${this.getLength()} fields`;
    } else if (this.element.currentType === 'Array') {
      element = `[] ${this.getLength()} elements`;
    } else {
      element = (
        <BSONValue
          type={this.props.value.currentType}
          value={this.props.value.currentValue}
        />
      );
    }

    return (
      <div className={className}>
        {this.props.value.decrypted && (
          <span
            data-testid="hadron-document-element-decrypted-icon"
            title="Encrypted Field"
          >
            <Icon glyph="Key" size="small" />
          </span>
        )}
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
      <button
        type="button"
        className={`${undoButtonClass}`}
        onClick={this.handleUndo.bind(this)}
      >
        <span className={'fa fa-rotate-left'} aria-hidden />
      </button>
    );
  }

  renderExpand(canExpand) {
    if (!canExpand) {
      return null;
    }
    return (
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={this.handleDrillDown.bind(this)}
      >
        <span className={'fa fa-expand'} aria-hidden />
      </button>
    );
  }

  render() {
    let element;
    let className = BEM_BASE;
    let canUndo = false;
    let canExpand = false;

    if (!this.editable) {
      element = '';
      className = `${className}-${UNEDITABLE}`;
    } else if (this.isEmpty || this.isDeleted) {
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
      if (this.element.isAdded()) {
        className = `${className}-${ADDED}`;
        canUndo = true;
      } else if (this.element.isModified()) {
        className = `${className}-${EDITED}`;
        canUndo = true;
      }
      canExpand =
        this.element.currentType === 'Object' ||
        this.element.currentType === 'Array';
    }

    return (
      // TODO: COMPASS-5847 Fix accessibility issues and remove lint disables.
      /* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
      /* eslint-disable jsx-a11y/interactive-supports-focus */
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events
      <div
        className={className}
        onClick={this.handleClicked.bind(this)}
        role="button"
      >
        {/* eslint-enable jsx-a11y/interactive-supports-focus */}
        {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */}
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
  column: PropTypes.any,
  context: PropTypes.any,
  parentType: PropTypes.any.isRequired,
  elementAdded: PropTypes.func.isRequired,
  elementRemoved: PropTypes.func.isRequired,
  elementTypeChanged: PropTypes.func.isRequired,
  drillDown: PropTypes.func.isRequired,
  tz: PropTypes.string.isRequired,
};

CellRenderer.displayName = 'CellRenderer';

export default CellRenderer;
