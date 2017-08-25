const React = require('react');
const PropTypes = require('prop-types');
const EditableDocument = require('./editable-document');

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
    return (<EditableDocument {...this.props} />);
  }
}

Document.displayName = 'Document';

Document.propTypes = {
  doc: PropTypes.object.isRequired,
  expandAll: PropTypes.bool
};

module.exports = Document;
