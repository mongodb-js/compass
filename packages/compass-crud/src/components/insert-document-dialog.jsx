import includes from 'lodash.includes';
import pull from 'lodash.pull';
import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import jsonParse from 'fast-json-parse';
import InsertJsonDocument from 'components/insert-json-document';
import InsertDocument from 'components/insert-document';
import InsertDocumentFooter from 'components/insert-document-footer';
import { TextButton } from 'hadron-react-buttons';
import { ViewSwitcher } from 'hadron-react-components';
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
  componentWillReceiveProps(nextProps) { // eslint-disable-line complexity
    const isMany = this.hasManyDocuments();

    if (!isMany) {
      // When switching to Hadron Document View - reset the invalid elements list, which contains the
      // uuids of each element that current has BSON type cast errors.
      //
      // Subscribe to the validation errors for BSON types on the document.
      if (nextProps.isOpen && this.props.jsonView && !nextProps.jsonView) {
        this.invalidElements = [];
        nextProps.doc.on(Element.Events.Invalid, this.unsubscribeInvalid);
        nextProps.doc.on(Element.Events.Valid, this.unsubscribeValid);
      // Closing the modal or switching back to jsonView.
      //
      // Remove the listeners to the BSON type validation errors in order to
      // clean up properly.
      } else if ((!nextProps.isOpen && this.props.isOpen && !this.props.jsonView)
                 || (nextProps.isOpen && this.props.isOpen && !this.props.jsonView && nextProps.jsonView)) {
        this.props.doc.removeListener(Element.Events.Invalid, this.unsubscribeInvalid);
        this.props.doc.removeListener(Element.Events.Valid, this.unsubscribeValid);
      }
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
    if (this.hasManyDocuments()) {
      this.props.insertMany();
    } else {
      this.props.insertDocument();
    }
  }

  /**
   * Switches between JSON and Hadron Document views.
   *
   * In case of multiple documents, only switches the this.props.insert.jsonView
   * In other cases, also modifies this.props.insert.doc/jsonDoc to keep data in place.
   *
   * @param {String} view - which view we are looking at: JSON or LIST.
   */
  switchInsertDocumentView(view) {
    if (!this.hasManyDocuments()) {
      this.props.toggleInsertDocument(view);
    } else {
      this.props.toggleInsertDocumentView(view);
    }
  }

  /**
   * Does the document have errors with the bson types?  Checks for
   * invalidElements in hadron doc if in HadronDocument view, or parsing error
   * in JsonView of the modal
   *
   * Checks for invalidElements in hadron doc if in HadronDocument view, or
   * parsing error in JsonView of the modal
   *
   * @returns {Boolean} If the document has errors.
   */
  hasErrors() {
    if (this.props.jsonView && this.props.jsonDoc !== '') {
      return !!jsonParse(this.props.jsonDoc).err;
    }
    return this.invalidElements.length > 0;
  }

  /**
   * Check if the json pasted is multiple documents (array).
   *
   * @returns {bool} If many documents are currently being inserted.
   */
  hasManyDocuments() {
    const jsonDoc = jsonParse(this.props.jsonDoc).value;
    return Array.isArray(jsonDoc);
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

  renderDocumentOrJsonView() {
    if (!this.props.jsonView) {
      if (this.hasManyDocuments()) {
        return (
          <div className="view-not-supported">
            <p>This view is not supported for multiple documents. To specify data
               types and use other functionality of this view, please insert
               documents one at a time.</p>
          </div>
        );
      }
      return (
        this.renderDocument()
      );
    }

    return (
      <InsertJsonDocument updateJsonDoc={this.props.updateJsonDoc} jsonDoc={this.props.jsonDoc}/>
    );
  }

  /**
   * Render the modal dialog.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    const currentView = this.props.jsonView ? 'JSON' : 'List';

    return (
      <Modal
        show={this.props.isOpen}
        backdrop="static"
        onHide={this.handleHide.bind(this)}>
        <Modal.Header>
          <Modal.Title>Insert to Collection</Modal.Title>
        </Modal.Header>

        <Modal.Body onFocus={this.handleBlur.bind(this)}>
          <div className="insert-document-views">
            <p>VIEW</p>
            <ViewSwitcher
              buttonLabels={['JSON', 'List']}
              activeButton={currentView}
              disabled={this.hasErrors()}
              onClick={this.switchInsertDocumentView.bind(this)} />
          </div>
          {this.renderDocumentOrJsonView()}
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
  toggleInsertDocumentView: PropTypes.func.isRequired,
  toggleInsertDocument: PropTypes.func.isRequired,
  insertDocument: PropTypes.func.isRequired,
  insertMany: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  mode: PropTypes.string.isRequired,
  version: PropTypes.string.isRequired,
  updateJsonDoc: PropTypes.func.isRequired,
  jsonDoc: PropTypes.string,
  jsonView: PropTypes.bool,
  doc: PropTypes.object,
  tz: PropTypes.string
};

export default InsertDocumentDialog;
