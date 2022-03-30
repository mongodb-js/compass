import React from 'react';
import PropTypes from 'prop-types';
import { DocumentList } from '@mongodb-js/compass-components';

/**
 * The base class.
 */
const BASE = 'document';

/**
 * The contents class.
 */
const CONTENTS = `${BASE}-contents`;

/**
 * The initial field limit.
 */
const INITIAL_FIELD_LIMIT = 25;

/**
 * The test id.
 */
const TEST_ID = 'readonly-document';

/**
 * Component for a single readonly document in a list of documents.
 */
class ReadonlyDocument extends React.Component {
  state = {
    renderSize: INITIAL_FIELD_LIMIT
  };

  setRenderSize(newLimit) {
    this.setState({ renderSize: newLimit });
  }

  handleClone = () => {
    this.props.openInsertDocumentDialog(this.props.doc.generateObject(), true);
  }

  /**
   * Handle copying JSON to clipboard of the document.
   */
  handleCopy = () => {
    this.props.copyToClipboard(this.props.doc);
  }

  /**
   * Get the elements for the document.
   *
   * @returns {Array} The elements.
   */
  renderElements() {
    return (
      <DocumentList.Document
        value={this.props.doc}
        expanded={this.state.expandAll}
        visibleFieldsCount={this.state.renderSize}
      />
    );
  }

  /**
   * Render the expander bar.
   *
   * @returns {React.Component} The expander bar.
   */
  renderExpansion() {
    return (
      <DocumentList.DocumentFieldsToggleGroup
        currentSize={this.state.renderSize}
        totalSize={this.props.doc.elements.size}
        minSize={INITIAL_FIELD_LIMIT}
        onSizeChange={this.setRenderSize.bind(this)}
      />
    );
  }

  renderActions() {
    return (
      <DocumentList.DocumentActionsGroup
        onCopy={this.props.copyToClipboard ? this.handleCopy : undefined}
        onClone={this.props.openInsertDocumentDialog ? this.handleClone : undefined}
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
      <div className={BASE} data-test-id={TEST_ID}>
        <div className={CONTENTS}>
          {this.renderElements()}
          {this.renderExpansion()}
          {this.renderActions()}
        </div>
      </div>
    );
  }
}

ReadonlyDocument.displayName = 'ReadonlyDocument';

ReadonlyDocument.propTypes = {
  copyToClipboard: PropTypes.func,
  doc: PropTypes.object.isRequired,
  expandAll: PropTypes.bool,
  openInsertDocumentDialog: PropTypes.func,
  tz: PropTypes.string
};

export default ReadonlyDocument;
