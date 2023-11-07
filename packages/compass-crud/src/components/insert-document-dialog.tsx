import { pull } from 'lodash';
import React from 'react';
import type Document from 'hadron-document';
import { Element } from 'hadron-document';
import {
  Banner,
  css,
  FormModal,
  Icon,
  SegmentedControl,
  SegmentedControlOption,
  spacing,
} from '@mongodb-js/compass-components';

import type { InsertCSFLEWarningBannerProps } from './insert-csfle-warning-banner';
import InsertCSFLEWarningBanner from './insert-csfle-warning-banner';
import InsertJsonDocument from './insert-json-document';
import InsertDocument from './insert-document';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { withLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

/**
 * The insert invalid message.
 */
const INSERT_INVALID_MESSAGE =
  'Insert not permitted while document contains errors.';

const documentViewId = 'insert-document-view';

const toolbarStyles = css({
  marginTop: spacing[2],
  display: 'flex',
  justifyContent: 'flex-end',
});

const documentViewContainer = css({
  marginTop: spacing[3],
});

const bannerStyles = css({
  marginTop: spacing[3],
});

export type InsertDocumentDialogProps = InsertCSFLEWarningBannerProps & {
  closeInsertDocumentDialog: () => void;
  toggleInsertDocumentView: (view: 'JSON' | 'List') => void;
  toggleInsertDocument: (view: 'JSON' | 'List') => void;
  insertDocument: () => void;
  insertMany: () => void;
  isOpen: boolean;
  message: string;
  mode: 'modifying' | 'error';
  version: string;
  updateJsonDoc: (value: string | null) => void;
  jsonDoc: string;
  jsonView: boolean;
  doc: Document;
  ns: string;
  tz: string;
  isCommentNeeded: boolean;
  updateComment: (isCommentNeeded: boolean) => void;
  logger?: LoggerAndTelemetry;
};

type InsertDocumentDialogState = {
  insertInProgress: boolean;
};

/**
 * Component for the insert document dialog.
 */
class InsertDocumentDialog extends React.PureComponent<
  InsertDocumentDialogProps,
  InsertDocumentDialogState
> {
  invalidElements: Document['uuid'][];

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props: InsertDocumentDialogProps) {
    super(props);
    this.state = { insertInProgress: false };
    this.invalidElements = [];
  }

  /**
   * Handle subscriptions to the document.
   *
   * @param {Object} prevProps - The previous properties.
   */
  componentDidUpdate(
    prevProps: InsertDocumentDialogProps,
    state: InsertDocumentDialogState
  ) {
    if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen) {
      this.props.logger?.track('Screen', { name: 'insert_document_modal' });
    }

    if (this.props.isOpen && !this.hasManyDocuments()) {
      if (prevProps.jsonView && !this.props.jsonView) {
        // When switching to Hadron Document View.
        // Reset the invalid elements list, which contains the
        // uuids of each element that has BSON type cast errors.
        this.invalidElements = [];
        // Subscribe to the validation errors for BSON types on the document.
        this.props.doc.on(Element.Events.Invalid, this.handleInvalid);
        this.props.doc.on(Element.Events.Valid, this.handleValid);
      } else {
        // When switching to JSON View.
        // Remove the listeners to the BSON type validation errors in order to clean up properly.
        this.props.doc.removeListener(
          Element.Events.Invalid,
          this.handleInvalid
        );
        this.props.doc.removeListener(Element.Events.Valid, this.handleValid);
      }
    }

    if (state.insertInProgress) {
      this.setState({ insertInProgress: false });
    }
  }

  componentWillUnount() {
    if (!this.hasManyDocuments()) {
      // When closing the modal.
      // Remove the listeners to the BSON type validation errors in order to clean up properly.
      this.props.doc.removeListener(Element.Events.Invalid, this.handleInvalid);
      this.props.doc.removeListener(Element.Events.Valid, this.handleValid);
    }
  }

  /**
   * Handles an element in the document becoming valid from invalid.
   *
   * @param {Element} el - Element
   */
  handleValid = (el: Element) => {
    if (this.hasErrors()) {
      pull(this.invalidElements, el.uuid);
      this.forceUpdate();
    }
  };

  /**
   * Handles a valid element in the document becoming invalid.
   *
   * @param {Element} el - Element
   */
  handleInvalid = (el: Element) => {
    if (!this.invalidElements.includes(el.uuid)) {
      this.invalidElements.push(el.uuid);
      this.forceUpdate();
    }
  };

  /**
   * Handle the insert.
   */
  handleInsert() {
    this.setState({ insertInProgress: true });
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
  switchInsertDocumentView(view: string) {
    if (!this.hasManyDocuments()) {
      this.props.toggleInsertDocument(view as 'JSON' | 'List');
    } else {
      this.props.toggleInsertDocumentView(view as 'JSON' | 'List');
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
      try {
        JSON.parse(this.props.jsonDoc);
        return false;
      } catch {
        return true;
      }
    }
    return this.invalidElements.length > 0;
  }

  /**
   * Check if the json pasted is multiple documents (array).
   *
   * @returns {bool} If many documents are currently being inserted.
   */
  hasManyDocuments() {
    let jsonDoc: unknown;
    try {
      jsonDoc = JSON.parse(this.props.jsonDoc);
    } catch {
      return false;
    }
    return Array.isArray(jsonDoc);
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
          <Banner variant="warning">
            This view is not supported for multiple documents. To specify data
            types and use other functionality of this view, please insert
            documents one at a time.
          </Banner>
        );
      }

      if (!this.props.doc) {
        return;
      }

      return <InsertDocument doc={this.props.doc} />;
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
    const variant = this.state.insertInProgress ? 'info' : 'danger';

    let message = this.props.message;

    if (this.hasErrors()) {
      message = INSERT_INVALID_MESSAGE;
    }

    if (this.state.insertInProgress) {
      message = 'Inserting Document';
    }

    return (
      <FormModal
        title="Insert Document"
        subtitle={`To collection ${this.props.ns}`}
        className="insert-document-dialog"
        open={this.props.isOpen}
        onSubmit={this.handleInsert.bind(this)}
        onCancel={this.props.closeInsertDocumentDialog}
        submitButtonText="Insert"
        submitDisabled={this.hasErrors()}
        data-testid="insert-document-modal"
        minBodyHeight={spacing[6] * 2} // make sure there is enough space for the menu
      >
        <div className={toolbarStyles}>
          <SegmentedControl
            label="View"
            size="small"
            value={currentView}
            aria-controls={documentViewId}
            onChange={this.switchInsertDocumentView.bind(this)}
          >
            <SegmentedControlOption
              disabled={this.hasErrors()}
              data-testid="insert-document-dialog-view-json"
              aria-label="E-JSON View"
              value="JSON"
              glyph={<Icon glyph="CurlyBraces" />}
              onClick={(evt) => {
                // We override the `onClick` functionality to prevent form submission.
                // The value changing occurs in the `onChange` in the `SegmentedControl`.
                evt.preventDefault();
              }}
            ></SegmentedControlOption>
            <SegmentedControlOption
              disabled={this.hasErrors()}
              data-testid="insert-document-dialog-view-list"
              aria-label="Document list"
              value="List"
              onClick={(evt) => {
                // We override the `onClick` functionality to prevent form submission.
                // The value changing occurs in the `onChange` in the `SegmentedControl`.
                evt.preventDefault();
              }}
              glyph={<Icon glyph="Menu" />}
            ></SegmentedControlOption>
          </SegmentedControl>
        </div>
        <div className={documentViewContainer} id={documentViewId}>
          {this.renderDocumentOrJsonView()}
        </div>
        {message && (
          <Banner
            data-testid="insert-document-banner"
            data-variant={variant}
            variant={variant}
            className={bannerStyles}
          >
            {message}
          </Banner>
        )}
        <InsertCSFLEWarningBanner csfleState={this.props.csfleState} />
      </FormModal>
    );
  }
}

export default withLoggerAndTelemetry(InsertDocumentDialog, 'COMPASS-CRUD-UI');
