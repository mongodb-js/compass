const React = require('react');
const PropTypes = require('prop-types');
const { StatusRow } = require('hadron-react-components');
const DocumentListView = require('./document-list-view');
const DocumentTableView = require('./document-table-view');

/**
 * Component for the entire document list.
 */
class DocumentList extends React.Component {

  /**
   * Render the views for the document list.
   *
   * @returns {React.Component} The document list views.
   */
  renderViews() {
    if (this.props.view === 'List') {
      return (
        <DocumentListView
          docs={this.props.docs}
          isEditable={this.props.isEditable} />
      );
    }
    return (
      <DocumentTableView docs={this.props.docs}
                         isEditable={this.props.isEditable}
                         ns={this.props.ns}
                         startIndex={this.props.start} />
    );
  }

  /**
   * Render the list of documents.
   *
   * @returns {React.Component} The list.
   */
  render() {
    if (this.props.error) {
      return (
        <StatusRow style="error">
          {this.props.error.message}
        </StatusRow>
      );
    }
    return (
      <div className="column-container">
        <div className="column main">
          {this.renderViews()}
        </div>
      </div>
    );
  }
}

DocumentList.displayName = 'DocumentList';

DocumentList.propTypes = {
  docs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool.isRequired,
  ns: PropTypes.string.isRequired,
  view: PropTypes.string.isRequired,
  start: PropTypes.number.isRequired,
  error: PropTypes.object
};

DocumentList.Document = Document;

module.exports = DocumentList;
