import React from 'react';
import PropTypes from 'prop-types';
import type { Document } from 'hadron-document';
import HadronDocument from 'hadron-document';
import { DocumentList, css } from '@mongodb-js/compass-components';
import { withPreferences } from 'compass-preferences-model/provider';

import { documentStyles, documentContentStyles } from './readonly-document';
import { getInsightsForDocument } from '../utils';
import type { CrudActions } from '../stores/crud-store';

const documentElementsContainerStyles = css({
  position: 'relative',
});

export type EditableDocumentProps = {
  doc: Document;
  removeDocument?: CrudActions['removeDocument'];
  replaceDocument?: CrudActions['replaceDocument'];
  updateDocument?: CrudActions['updateDocument'];
  openInsertDocumentDialog?: CrudActions['openInsertDocumentDialog'];
  copyToClipboard?: CrudActions['copyToClipboard'];
  showInsights?: boolean;
  onUpdateQuery?: (field: string, value: unknown) => void;
  query?: Record<string, unknown>;
};

type EditableDocumentState = {
  editing: boolean;
  deleting: boolean;
  expanded: boolean;
};

/**
 * Component for a single editable document in a list of documents.
 */
class EditableDocument extends React.Component<
  EditableDocumentProps,
  EditableDocumentState
> {
  constructor(props: EditableDocumentProps) {
    super(props);
    this.state = {
      editing: props.doc.editing,
      deleting: props.doc.markedForDeletion,
      expanded: props.doc.expanded,
    };
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.subscribeToDocumentEvents(this.props.doc);
  }

  /**
   * Refreshing the list updates the doc in the props so we should update the
   * document on the instance.
   *
   * @param {Object} prevProps - The previous props.
   */
  componentDidUpdate(prevProps: EditableDocumentProps) {
    if (prevProps.doc !== this.props.doc) {
      this.unsubscribeFromDocumentEvents(prevProps.doc);
      this.subscribeToDocumentEvents(this.props.doc);
      if (this.state.editing || this.state.deleting) {
        // If the underlying document changed, that means that the collection
        // contents have been refreshed. In that case, stop editing/deleting.
        setTimeout(() => {
          this.setState({ editing: false, deleting: false });
        });
      }
    }
  }

  /**
   * Unsubscribe from the update store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeFromDocumentEvents(this.props.doc);
  }

  /**
   * Subscribe to the hadron document events.
   *
   * @param {Document} doc - The hadron document.
   */
  subscribeToDocumentEvents(doc: Document) {
    doc.on(HadronDocument.Events.Cancel, this.handleCancel);
    doc.on(HadronDocument.Events.Expanded, this.handleExpanded);
    doc.on(HadronDocument.Events.Collapsed, this.handleCollapsed);
    doc.on(HadronDocument.Events.EditingStarted, this.handleEditingStarted);
    doc.on(HadronDocument.Events.EditingFinished, this.handleEditingFinished);
    doc.on(HadronDocument.Events.MarkedForDeletion, this.handleDeletionStarted);
    doc.on(HadronDocument.Events.DeletionFinished, this.handleDeletionFinished);
  }

  /**
   * Unsubscribe from the hadron document events.
   *
   * @param {Document} doc - The hadron document.
   */
  unsubscribeFromDocumentEvents(doc: Document) {
    doc.removeListener(HadronDocument.Events.Cancel, this.handleCancel);
    doc.removeListener(HadronDocument.Events.Expanded, this.handleExpanded);
    doc.removeListener(HadronDocument.Events.Collapsed, this.handleCollapsed);
    doc.removeListener(
      HadronDocument.Events.EditingStarted,
      this.handleEditingStarted
    );
    doc.removeListener(
      HadronDocument.Events.EditingFinished,
      this.handleEditingFinished
    );
    doc.removeListener(
      HadronDocument.Events.MarkedForDeletion,
      this.handleDeletionStarted
    );
    doc.removeListener(
      HadronDocument.Events.DeletionFinished,
      this.handleDeletionFinished
    );
  }

  /**
   * Handle copying JSON to clipboard of the document.
   */
  handleCopy() {
    this.props.copyToClipboard?.(this.props.doc);
  }

  /**
   * Handle cloning of the document.
   */
  handleClone() {
    const clonedDoc = this.props.doc.generateObject({
      excludeInternalFields: true,
    });
    void this.props.openInsertDocumentDialog?.(clonedDoc, true);
  }

  /**
   * Handles canceling edits to the document.
   */
  handleCancel = () => {
    if (this.state.editing) {
      this.props.doc.finishEditing();
    } else if (this.state.deleting) {
      this.props.doc.finishDeletion();
    }
  };

  /**
   * Handles document deletion.
   */
  handleDelete() {
    this.props.doc.markForDeletion();
  }

  handleDeletionStarted = () => {
    this.setState({
      editing: false,
      deleting: true,
    });
  };

  handleDeletionFinished = () => {
    this.setState({
      deleting: false,
    });
  };

  /**
   * Handle clicking the expand all button.
   */
  handleExpandAll() {
    const { doc } = this.props;
    if (this.state.expanded) {
      doc.collapse();
    } else {
      doc.expand();
    }
  }

  handleExpanded = () => {
    this.setState({ expanded: true });
  };

  handleCollapsed = () => {
    this.setState({ expanded: false });
  };

  /**
   * Handle the edit click.
   */
  handleStartEditing() {
    this.props.doc.startEditing();
  }

  /**
   * Update state when editing starts
   */
  handleEditingStarted = () => {
    this.setState({ editing: true });
  };

  /**
   * Update state when editing starts
   */
  handleEditingFinished = () => {
    this.setState({
      editing: false,
    });
  };

  /**
   * Render the actions component.
   *
   * @returns {Component} The actions component.
   */
  renderActions() {
    if (!this.state.editing && !this.state.deleting) {
      return (
        <DocumentList.DocumentActionsGroup
          onEdit={this.handleStartEditing.bind(this)}
          onCopy={this.handleCopy.bind(this)}
          onRemove={this.handleDelete.bind(this)}
          onClone={this.handleClone.bind(this)}
          onExpand={this.handleExpandAll.bind(this)}
          expanded={this.state.expanded}
          insights={
            this.props.showInsights
              ? getInsightsForDocument(this.props.doc)
              : undefined
          }
        />
      );
    }
  }

  /**
   * Get the elements for the document. If we are editing, we get editable elements,
   * otherwise the readonly elements are returned.
   *
   * @returns {Array} The elements.
   */
  renderElements() {
    return (
      <DocumentList.Document
        value={this.props.doc}
        editable
        editing={this.state.editing}
        onEditStart={this.handleStartEditing.bind(this)}
        onUpdateQuery={this.props.onUpdateQuery}
        query={this.props.query}
      />
    );
  }

  /**
   * Render the footer component.
   *
   * @returns {Component} The footer component.
   */
  renderFooter() {
    return (
      <DocumentList.DocumentEditActionsFooter
        doc={this.props.doc}
        editing={this.state.editing}
        deleting={this.state.deleting}
        onUpdate={(force) => {
          if (force) {
            void this.props.replaceDocument?.(this.props.doc);
          } else {
            void this.props.updateDocument?.(this.props.doc);
          }
        }}
        onDelete={() => {
          void this.props.removeDocument?.(this.props.doc);
        }}
        onCancel={() => {
          this.handleCancel();
        }}
      />
    );
  }

  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={documentStyles} data-testid="editable-document">
        <div className={documentContentStyles}>
          <div
            className={documentElementsContainerStyles}
            data-testid="editable-document-elements"
          >
            {this.renderElements()}
          </div>
          {this.renderActions()}
        </div>
        {this.renderFooter()}
      </div>
    );
  }

  static displayName = 'EditableDocument';

  static propTypes = {
    doc: PropTypes.object.isRequired,
    expandAll: PropTypes.bool,
    removeDocument: PropTypes.func.isRequired,
    replaceDocument: PropTypes.func.isRequired,
    updateDocument: PropTypes.func.isRequired,
    openInsertDocumentDialog: PropTypes.func.isRequired,
    copyToClipboard: PropTypes.func.isRequired,
    showInsights: PropTypes.bool,
    onUpdateQuery: PropTypes.func,
    query: PropTypes.object,
  };
}

export default withPreferences(EditableDocument, ['showInsights']);
