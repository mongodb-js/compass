import React from 'react';
import PropTypes from 'prop-types';
import EditableDocument from './editable-document';
import ReadonlyDocument from './readonly-document';

/**
 * Component for a single document in a list of documents.
 */
class Document extends React.Component {
  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    if (this.props.editable && this.props.isTimeSeries) {
      return (
        <ReadonlyDocument
          copyToClipboard={this.props.copyToClipboard}
          doc={this.props.doc}
          tz={this.props.tz}
          openInsertDocumentDialog={this.props.openInsertDocumentDialog}
        />
      );
    }
    if (this.props.editable) {
      return (<EditableDocument {...this.props} />);
    }
    return (
      <ReadonlyDocument
        copyToClipboard={this.props.copyToClipboard}
        doc={this.props.doc}
        tz={this.props.tz}
      />
    );
  }
}

Document.displayName = 'Document';

Document.propTypes = {
  doc: PropTypes.object.isRequired,
  tz: PropTypes.string,
  copyToClipboard: PropTypes.func,
  editable: PropTypes.bool,
  isTimeSeries: PropTypes.bool,
  removeDocument: PropTypes.func,
  replaceDocument: PropTypes.func,
  updateDocument: PropTypes.func,
  openImportFileDialog: PropTypes.func,
  openInsertDocumentDialog: PropTypes.func
};

export default Document;
