import { pull } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import jsonParse from 'fast-json-parse';
import { ViewSwitcher } from 'hadron-react-components';
import { Element } from 'hadron-document';
import { FormModal, css, spacing } from '@mongodb-js/compass-components';

import InsertCSFLEWarningBanner from './insert-csfle-warning-banner';
import InsertJsonDocument from './insert-json-document';
import InsertDocument from './insert-document';
import InsertDocumentFooter from './insert-document-footer';

/**
 * The insert invalid message.
 */
const INSERT_INVALID_MESSAGE =
  'Insert not permitted while document contains errors.';

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
    this.state = { message: this.props.message, mode: this.props.mode };
    this.unsubscribeInvalid = this.handleInvalid.bind(this);
    this.unsubscribeValid = this.handleValid.bind(this);
    this.invalidElements = [];
  }

  /**
   * Handle the property updates and subscriptions to the document.
   *
   * @param {Object} nextProps - The new properties.
   */
  // TODO: COMPASS-5847 Remove deprecated react function usage.
  UNSAFE_componentWillReceiveProps(nextProps) {
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
      } else if (
        (!nextProps.isOpen && this.props.isOpen && !this.props.jsonView) ||
        (nextProps.isOpen &&
          this.props.isOpen &&
          !this.props.jsonView &&
          nextProps.jsonView)
      ) {
        this.props.doc.removeListener(
          Element.Events.Invalid,
          this.unsubscribeInvalid
        );
        this.props.doc.removeListener(
          Element.Events.Valid,
          this.unsubscribeValid
        );
      }
    }
    this.setState({ message: nextProps.message, mode: nextProps.mode });
  }

  /**
   * Handles an element in the document becoming valid from invalid.
   *
   * @param {Element} el - Element
   */
  handleValid(el) {
    if (this.hasErrors()) {
      pull(this.invalidElements, el.uuid);
      this.forceUpdate();
    }
  }

  /**
   * Handles a valid element in the document becoming invalid.
   *
   * @param {Element} el - Element
   */
  handleInvalid(el) {
    if (!this.invalidElements.includes(el.uuid)) {
      this.invalidElements.push(el.uuid);
      this.forceUpdate();
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
    if (this.props.jsonView) {
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
        <InsertDocument
          doc={this.props.doc}
          version={this.props.version}
          tz={this.props.tz}
        />
      );
    }
  }

  /**
   * Render the document or json editor.
   *
   * @returns {React.Component} The component.
   */
  renderDocumentOrJsonView() {
    if (!this.props.jsonView) {
      if (this.hasManyDocuments()) {
        return (
          <div className="view-not-supported">
            <p>
              This view is not supported for multiple documents. To specify data
              types and use other functionality of this view, please insert
              documents one at a time.
            </p>
          </div>
        );
      }
      return this.renderDocument();
    }

    return (
      <InsertJsonDocument
        updateJsonDoc={this.props.updateJsonDoc}
        jsonDoc={this.props.jsonDoc}
        isCommentNeeded={this.props.isCommentNeeded}
        updateComment={this.props.updateComment}
      />
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
      <FormModal
        title={`Insert to Collection ${this.props.ns}`}
        className="insert-document-dialog"
        open={this.props.isOpen}
        onSubmit={this.handleInsert.bind(this)}
        onCancel={this.props.closeInsertDocumentDialog}
        submitButtonText="Insert"
        submitDisabled={this.hasErrors()}
        trackingId="insert_document_modal"
        data-testid="insert-document-modal"
        scrollClassName={css({ minHeight: spacing[6]*2})} // make sure there is enough space for the menu
      >
        <div className="insert-document-views">
          <ViewSwitcher
            dataTestId="insert-document-dialog-view"
            label="View"
            buttonLabels={['JSON', 'List']}
            showLabels={false}
            iconClassNames={['curly-bracket', 'fa fa-list-ul']}
            activeButton={currentView}
            disabled={this.hasErrors()}
            onClick={this.switchInsertDocumentView.bind(this)}
          />
        </div>
        {this.renderDocumentOrJsonView()}
        <InsertDocumentFooter
          message={
            this.hasErrors() ? INSERT_INVALID_MESSAGE : this.state.message
          }
          mode={this.hasErrors() ? 'error' : this.state.mode}
        />
        <InsertCSFLEWarningBanner csfleState={this.props.csfleState} />
      </FormModal>
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
  csfleState: PropTypes.object.isRequired,
  mode: PropTypes.string.isRequired,
  version: PropTypes.string.isRequired,
  updateJsonDoc: PropTypes.func.isRequired,
  jsonDoc: PropTypes.string,
  jsonView: PropTypes.bool,
  doc: PropTypes.object,
  ns: PropTypes.string,
  tz: PropTypes.string,
  isCommentNeeded: PropTypes.bool,
  updateComment: PropTypes.func.isRequired,
};

export default InsertDocumentDialog;
