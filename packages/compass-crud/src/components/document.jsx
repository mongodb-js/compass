const React = require('react');
const PropTypes = require('prop-types');
const EditableDocument = require('./editable-document');
const ReadonlyDocument = require('./readonly-document');

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
        expandAll={this.props.expandAll} />
    );
  }
}

Document.displayName = 'Document';

Document.propTypes = {
  doc: PropTypes.object.isRequired,
  editable: PropTypes.bool,
  expandAll: PropTypes.bool
};

module.exports = Document;
