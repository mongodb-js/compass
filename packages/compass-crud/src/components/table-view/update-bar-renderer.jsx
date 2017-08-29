const React = require('react');
const PropTypes = require('prop-types');
// const _ = require('lodash');
const util = require('util');
const EditableValue = require('../editable-value');
const getComponent = require('hadron-react-bson');
const { Element } = require('hadron-document');
const initEditors = require('../editor/');

/**
 * The custom full-width cell renderer that renders the update/cancel bar
 * in the table view.
 */
class UpdateBarRenderer extends React.Component {
  constructor(props) {
    super(props);
    props.api.selectAll();

    this.element = props.data;

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

  render() {
    // const element = this.props.editable ? this.renderEditable() : this.renderReadOnly();
    return (
      <div className="update-bar-row">
        <span> UPDATE BAR</span>
      </div>
    );
  }
}

UpdateBarRenderer.propTypes = {
  api: PropTypes.any,
  value: PropTypes.any
};

UpdateBarRenderer.displayName = 'UpdateBarRenderer';

module.exports = UpdateBarRenderer;
