const _ = require('lodash');
const React = require('react');
const Modal = require('react-bootstrap').Modal;
const OpenInsertDocumentDialogStore = require('../stores/open-insert-document-dialog-store');
const InsertDocumentStore = require('../stores/insert-document-store');
const InsertDocument = require('./insert-document');
const InsertDocumentFooter = require('./insert-document-footer');
const { TextButton } = require('hadron-react-buttons');
const { Element } = require('hadron-document');
const Actions = require('../actions');

/**
 * Component for the insert document dialog.
 */
class InsertDocumentDialog extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { open: false, canHide: false };
  }

  /**
   * Subscribe to the open dialog store.
   */
  componentWillMount() {
    this.invalidElements = [];
    this.unsubscribeOpen = OpenInsertDocumentDialogStore.listen(this.handleStoreOpen.bind(this));
    this.unsubscribeInsert = InsertDocumentStore.listen(this.handleDocumentInsert.bind(this));
    this.unsubscribeClose = Actions.closeInsertDocumentDialog.listen(this.closeDialog.bind(this));
  }

  /**
   * Unsubscribe from the store.
   */
  componentWillUnmount() {
    this.unsubscribeOpen();
    this.unsubscribeInsert();
    this.unsubscribeClose();
  }

  /**
   * Close the dialog.
   */
  closeDialog() {
    this.invalidElements = [];
    this.state.doc.removeListener(Element.Events.Invalid, this.unsubscribeInvalid);
    this.state.doc.removeListener(Element.Events.Valid, this.unsubscribeValid);
    this.setState({ open: false });
  }

  /**
   * Handle opening the dialog with the new document.
   *
   * @param {Object} doc - The document.
   */
  handleStoreOpen(doc) {
    this.setState({ doc: doc, open: true });
    this.unsubscribeInvalid = this.handleInvalid.bind(this);
    this.unsubscribeValid = this.handleValid.bind(this);
    this.state.doc.on(Element.Events.Invalid, this.unsubscribeInvalid);
    this.state.doc.on(Element.Events.Valid, this.unsubscribeValid);
  }

  /**
   * Handle canceling the insert.
   */
  handleCancel() {
    this.closeDialog();
  }

  /**
   * handle losing focus from element
   */
  handleBlur() {
    this.setState({canHide: false});
  }

  /**
   * handle hide event rather than cancel
   */
  handleHide() {
    if (this.state.canHide) {
      this.closeDialog();
    } else {
      this.setState({ canHide: true });
    }
  }

  /**
   * Handles completion of the document insert.
   *
   * @param {Error} error - Any error in the insert.
   */
  handleDocumentInsert(error) {
    if (!error) {
      this.closeDialog();
    }
  }

  handleValid(uuid) {
    _.pull(this.invalidElements, uuid);
    this.forceUpdate();
    Actions.elementValid(uuid);
  }

  handleInvalid(uuid) {
    if (!_.includes(this.invalidElements, uuid)) {
      this.invalidElements.push(uuid);
      this.forceUpdate();
      Actions.elementInvalid(uuid);
    }
  }

  /**
   * Handle the insert.
   */
  handleInsert() {
    Actions.insertDocument(this.state.doc.generateObject());
  }

  hasErrors() {
    return this.invalidElements.length > 0;
  }

  /**
   * Render the modal dialog.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <Modal show={this.state.open} backdrop="static"
          onHide={this.handleHide.bind(this)}>
        <Modal.Header>
          <Modal.Title>Insert Document</Modal.Title>
        </Modal.Header>

        <Modal.Body onFocus={this.handleBlur.bind(this)} >
          <InsertDocument doc={this.state.doc} />
          <InsertDocumentFooter />
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.handleCancel.bind(this)} />
          <TextButton
            className="btn btn-primary btn-sm"
            dataTestId="insert-document-button"
            text="Insert"
            disabled={this.hasErrors()}
            clickHandler={this.handleInsert.bind(this)} />
        </Modal.Footer>
      </Modal>
    );
  }
}

InsertDocumentDialog.displayName = 'InsertDocumentDialog';

module.exports = InsertDocumentDialog;
