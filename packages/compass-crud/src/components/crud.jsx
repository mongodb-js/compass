const React = require('react');
const PropTypes = require('prop-types');
const ObjectId = require('bson').ObjectId;
const InsertDocumentDialog = require('./insert-document-dialog');
const DocumentList = require('./document-list');
const Toolbar = require('./toolbar');

/**
 * Component for the entire CRUD plugin.
 */
class CRUD extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.queryBar = global.hadronApp.appRegistry.getComponent('Query.QueryBar');
  }

  /**
   * Handle opening of the insert dialog.
   */
  handleOpenInsert() {
    this.props.actions.openInsertDocumentDialog({ _id: new ObjectId(), '': '' }, false);
  }

  /**
   * Render the document list.
   *
   * @returns {React.Component} The document list.
   */
  render() {
    return (
      <div className="content-container content-container-documents compass-documents">
        <div className="controls-container">
          <this.queryBar buttonLabel="Find" />
          <Toolbar
            readonly={!this.props.isEditable}
            insertHandler={this.handleOpenInsert.bind(this)}
            viewSwitchHandler={this.props.actions.changeView}
            activeDocumentView={this.props.view} />
        </div>
        <DocumentList {...this.props} />
        <InsertDocumentDialog />
      </div>
    );
  }
}

CRUD.displayName = 'CRUD';

CRUD.propTypes = {
  docs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool.isRequired,
  ns: PropTypes.string.isRequired,
  view: PropTypes.string.isRequired,
  start: PropTypes.number.isRequired,
  actions: PropTypes.object.isRequired,
  error: PropTypes.object
};

module.exports = CRUD;
