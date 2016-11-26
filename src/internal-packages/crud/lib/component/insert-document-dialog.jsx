const React = require('react');
const Modal = require('react-bootstrap').Modal;
const OpenInsertDocumentDialogStore = require('../store/open-insert-document-dialog-store');
const InsertDocumentStore = require('../store/insert-document-store');
const InsertDocument = require('./insert-document');
const InsertDocumentFooter = require('./insert-document-footer');
const TextButton = require('hadron-app-registry').TextButton;
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
    this.state = { open: false };
  }

  /**
   * Subscribe to the open dialog store.
   */
  componentWillMount() {
    this.unsubscribeOpen = OpenInsertDocumentDialogStore.listen(this.handleStoreOpen.bind(this));
    this.unsubscribeInsert = InsertDocumentStore.listen(this.handleDocumentInsert.bind(this));
  }

  /**
   * Unsubscribe from the store.
   */
  componentWillUnmount() {
    this.unsubscribeOpen();
    this.unsubscribeInsert();
  }

  /**
   * Handle opening the dialog with the new document.
   *
   * @param {Object} doc - The document.
   */
  handleStoreOpen(doc) {
    this.setState({ doc: doc, open: true });
  }

  /**
   * Handle canceling the insert.
   */
  handleCancel() {
    this.setState({ open: false });
  }

  /**
   * Handles completion of the document insert.
   *
   * @param {Boolean} success - If the operation succeeded.
   */
  handleDocumentInsert(success) {
    if (success) {
      this.setState({ open: false });
    }
  }

  /**
   * Handle the insert.
   */
  handleInsert() {
    Actions.insertDocument(this.state.doc.generateObject());
  }

  /**
   * Render the modal dialog.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <Modal show={this.state.open} backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title>Insert Document</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <InsertDocument doc={this.state.doc} />
          <InsertDocumentFooter />
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default"
            text="Cancel"
            clickHandler={this.handleCancel.bind(this)} />
          <TextButton
            className="btn btn-primary"
            dataTestId="insert-document-button"
            text="Insert"
            clickHandler={this.handleInsert.bind(this)} />
        </Modal.Footer>
      </Modal>
    );
  }
}

InsertDocumentDialog.displayName = 'InsertDocumentDialog';

module.exports = InsertDocumentDialog;
