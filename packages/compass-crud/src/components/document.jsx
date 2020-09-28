import React from 'react';
import PropTypes from 'prop-types';
import EditableDocument from 'components/editable-document';
import ReadonlyDocument from 'components/readonly-document';

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
    if (this.props.editable) {
      return (<EditableDocument {...this.props} />);
    }
    return (
      <ReadonlyDocument
        doc={this.props.doc}
        tz={this.props.tz}
        expandAll={this.props.expandAll} />
    );
  }
}

Document.displayName = 'Document';

Document.propTypes = {
  doc: PropTypes.object.isRequired,
  tz: PropTypes.string,
  editable: PropTypes.bool,
  expandAll: PropTypes.bool,
  removeDocument: PropTypes.func,
  replaceDocument: PropTypes.func,
  updateDocument: PropTypes.func,
  openImportFileDialog: PropTypes.func,
  openInsertDocumentDialog: PropTypes.func
};

export default Document;
