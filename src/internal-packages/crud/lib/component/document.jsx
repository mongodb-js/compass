const React = require('react');
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
        preExpanded={this.props.preExpanded} />
    );
  }
}

Document.displayName = 'Document';

Document.propTypes = {
  doc: React.PropTypes.object.isRequired,
  editable: React.PropTypes.bool,
  preExpanded: React.PropTypes.bool
};

module.exports = Document;
