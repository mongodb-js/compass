'use strict';

const React = require('react');
const Modal = require('react-bootstrap').Modal;
const OpenInsertDocumentDialogStore = require('../store/open-insert-document-dialog-store');
const InsertDocument = require('./insert-document');
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

  componentWillMount() {
    this.unsubscribeOpen = OpenInsertDocumentDialogStore.listen(this.handleStoreOpen.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeOpen();
  }

  handleStoreOpen(doc) {
    this.setState({ doc: doc, open: true });
  }

  handleCancel() {
    this.setState({ open: false });
  }

  handleInsert() {
    this.setState({ open: false });
    Actions.insertDocument(this.state.doc.generateObject());
  }

  render() {
    return (
      <Modal show={this.state.open} backdrop='static' keyboard={false}>
        <Modal.Header>
          <Modal.Title>Insert Document</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <InsertDocument doc={this.state.doc} />
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className='btn btn-default'
            text='Cancel'
            clickHandler={this.handleCancel.bind(this)} />
          <TextButton
            className='btn btn-primary'
            text='Insert'
            clickHandler={this.handleInsert.bind(this)} />
        </Modal.Footer>
      </Modal>
    );
  }
}

InsertDocumentDialog.displayName = 'InsertDocumentDialog';

module.exports = InsertDocumentDialog;
