import includes from 'lodash.includes';
import pull from 'lodash.pull';
import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import InsertDocument from 'components/insert-document';
import InsertDocumentFooter from 'components/insert-document-footer';
import { TextButton } from 'hadron-react-buttons';
import { Element } from 'hadron-document';

/**
 * The insert invalid message.
 */
const INSERT_INVALID_MESSAGE = 'Insert not permitted while document contains errors.';

/**
 * Component for the insert document dialog.
 */
class InsertDocumentDialog extends React.PureComponent {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { canHide: false, message: this.props.message, mode: this.props.mode };
    this.unsubscribeInvalid = this.handleInvalid.bind(this);
    this.unsubscribeValid = this.handleValid.bind(this);
    this.invalidElements = [];
  }

  /**
   * Handle the property updates and subscriptions to the document.
   *
   * @param {Object} nextProps - The new properties.
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.isOpen && !this.props.isOpen) {
      // Opening the modal - reset the invalid elements list, which contains the
      // uuids of each element that current has BSON type cast errors. Subscribe
      // to the validation errors for BSON types on the document.
      this.invalidElements = [];
      nextProps.doc.on(Element.Events.Invalid, this.unsubscribeInvalid);
      nextProps.doc.on(Element.Events.Valid, this.unsubscribeValid);
    } else if (!nextProps.isOpen && this.props.isOpen) {
      // Closing the modal. Remove the listeners to the BSON type validation errors
      // in order to clean up properly.
      this.props.doc.removeListener(Element.Events.Invalid, this.unsubscribeInvalid);
      this.props.doc.removeListener(Element.Events.Valid, this.unsubscribeValid);
    }
    this.setState({ message: nextProps.message, mode: nextProps.mode });
  }

  /**
   * Handles an element in the document becoming valid from invalid.
   *
   * @param {Stringg} uuid - The uuid of the element.
   */
  handleValid(uuid) {
    if (this.hasErrors()) {
      pull(this.invalidElements, uuid);
      this.forceUpdate();
    }
  }

  /**
   * Handles a valid element in the document becoming invalid.
   *
   * @param {String} uuid - The uuid of the element.
   */
  handleInvalid(uuid) {
    if (!includes(this.invalidElements, uuid)) {
      this.invalidElements.push(uuid);
      this.forceUpdate();
    }
  }

  /**
   * handle losing focus from element
   */
  handleBlur() {
    this.setState({ canHide: false });
  }

  /**
   * handle hide event rather than cancel
   */
  handleHide() {
    if (this.state.canHide) {
      this.props.closeInsertDocumentDialog();
    } else {
      this.setState({ canHide: true });
    }
  }

  /**
   * Handle the insert.
   */
  handleInsert() {
    this.setState({ message: 'Inserting Document', mode: 'progress' });
    this.props.insertDocument(this.props.doc);
  }

  /**
   * Does the document have errors with the bson types?
   *
   * @returns {Boolean} If the document has errors.
   */
  hasErrors() {
    return this.invalidElements.length > 0;
  }

  /**
   * Render the document component.
   *
   * @returns {React.Component} The component.
   */
  renderDocument() {
    if (this.props.doc) {
      return (
        <InsertDocument doc={this.props.doc} version={this.props.version} tz={this.props.tz} />
      );
    }
  }

  /**
   * Render the modal dialog.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <Modal
          show={this.props.isOpen}
          backdrop="static"
          onHide={this.handleHide.bind(this)}>
        <Modal.Header>
          <Modal.Title>Insert Document</Modal.Title>
        </Modal.Header>

        <Modal.Body onFocus={this.handleBlur.bind(this)}>
          {this.renderDocument()}
          <InsertDocumentFooter
            message={this.hasErrors() ? INSERT_INVALID_MESSAGE : this.state.message}
            mode={this.hasErrors() ? 'error' : this.state.mode} />
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.props.closeInsertDocumentDialog} />
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

InsertDocumentDialog.propTypes = {
  closeInsertDocumentDialog: PropTypes.func.isRequired,
  insertDocument: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  mode: PropTypes.string.isRequired,
  version: PropTypes.string.isRequired,
  doc: PropTypes.object,
  tz: PropTypes.string
};

export default InsertDocumentDialog;
