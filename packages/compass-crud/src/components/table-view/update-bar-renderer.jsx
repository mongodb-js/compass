const React = require('react');
const PropTypes = require('prop-types');
// const _ = require('lodash');
const util = require('util');
const EditableValue = require('../editable-value');
const getComponent = require('hadron-react-bson');
const { Element } = require('hadron-document');
const initEditors = require('../editor/');

const MESSAGE = {
  modified: 'Document Modified',
  editing: '',
  updated: 'Document Updated',
  deleted: 'Document Flagged For Deletion'
};

/**
 * The custom full-width cell renderer that renders the update/cancel bar
 * in the table view.
 *
 * Has four states: 'editing', 'modified', 'deleting', 'updated'.
 */
class UpdateBarRenderer extends React.Component {
  constructor(props) {
    super(props);
    props.api.selectAll();

    this.document = props.data.hadronDocument;

    this.state = {
      mode: props.data.state
    };

    this.handleCancel = this.handleCancel.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);

  }

  /**
   * Unsubscribe from the events.
   */
  componentWillUnmount() {
  }

  // subscribeToDocumentEvents() {
  //   this.unsubscribeFromDocumentEvents();
  //
  //   if (!this.unsubscribeAdded) {
  //     this.unsubscribeAdded = this.handleModify.bind(this);
  //     this.unsubscribeRemoved = this.handleModify.bind(this);
  //     this.unsubscribeCancel = this.handleCancel.bind(this);
  //   }
  //
  //   this.doc.on(Element.Events.Added, this.unsubscribeAdded);
  //   this.doc.on(Element.Events.Removed, this.unsubscribeRemoved);
  //   this.doc.on(HadronDocument.Events.Cancel, this.unsubscribeCancel);
  // }
  //
  // unsubscribeFromDocumentEvents() {
  //   if (this.unsubscribeAdded) {
  //     this.doc.removeListener(Element.Events.Added, this.unsubscribeAdded);
  //     this.doc.removeListener(Element.Events.Removed, this.unsubscribeRemoved);
  //     this.doc.removeListener(HadronDocument.Events.Cancel, this.unsubscribeCancel);
  //   }
  // }

  handleCancel() {
    console.log("cancel");
  }

  handleUpdate() {
    console.log("update");
  }

  render() {
    const modeName = `update-bar-row-${this.state.mode}`;
    return (
      <div className={modeName}>
        <span className="update-bar-row-message">{MESSAGE[this.state.mode]}</span>
        <button
          className="update-bar-row-button"
          type="button"
          onClick={this.handleCancel}>Cancel</button>
        <button
          className="update-bar-row-button"
          type="button"
          onClick={this.handleUpdate}>Update</button>
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
