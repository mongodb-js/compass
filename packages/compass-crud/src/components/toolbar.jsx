const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const { AnimatedIconTextButton } = require('hadron-react-buttons');
const { InfoSprinkle, ViewSwitcher } = require('hadron-react-components');
const { shell } = require('electron');
const pluralize = require('pluralize');
const Actions = require('../actions');
const ResetDocumentListStore = require('../stores/reset-document-list-store');
const LoadMoreDocumentsStore = require('../stores/load-more-documents-store');
const InsertDocumentStore = require('../stores/insert-document-store');

/**
 * The help URLs for things like the Documents tab.
 */
const HELP_URLS = Object.freeze({
  DOCUMENTS: 'https://docs.mongodb.com/compass/master/documents/',
  SCHEMA_SAMPLING: 'https://docs.mongodb.com/compass/current/faq/#what-is-sampling-and-why-is-it-used'
});

const BASE_CLASS = 'document-list';
const ACTION_BAR_CLASS = `${BASE_CLASS}-action-bar`;
const MESSAGE_CLASS = `${ACTION_BAR_CLASS}-message`;
const REFRESH_CLASS = `${ACTION_BAR_CLASS}-refresh`;
const VIEW_SWITCHER_CLASS = `${ACTION_BAR_CLASS}-view-switcher`;

/**
 * Component for the CRUD toolbar.
 */
class Toolbar extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { count: 0, loaded: 0 };
    this.TextWriteButton = app.appRegistry.getComponent('DeploymentAwareness.TextWriteButton');
    this.documentRemovedAction = Actions.documentRemoved;
    this.refreshDocumentsAction = Actions.refreshDocuments;
  }

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this.unsubscribeReset = ResetDocumentListStore.listen(this.handleReset.bind(this));
    this.unsubscribeInsert = InsertDocumentStore.listen(this.handleInsert.bind(this));
    this.unsubscribeRemove = this.documentRemovedAction.listen(this.handleRemove.bind(this));
    this.unsubscribeLoadMore = LoadMoreDocumentsStore.listen(this.handleLoadMore.bind(this));
  }

  /**
   * Unsibscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribeReset();
    this.unsubscribeInsert();
    this.unsubscribeRemove();
    this.unsubscribeLoadMore();
  }

  /**
   * Handle updating the count on document insert.
   *
   * @param {Error} error - If an error occurred.
   */
  handleInsert(error) {
    if (!error) {
      this.setState({ count: this.state.count + 1 });
    }
  }

  /**
   * Handle updating the count on document removal.
   */
  handleRemove() {
    this.setState({ count: this.state.count - 1, loaded: this.state.loaded - 1 });
  }

  /**
   * Handle the reset of the document list.
   *
   * @param {Object} error - The error
   * @param {Array} documents - The documents.
   * @param {Integer} count - The count.
   */
  handleReset(error, documents, count) {
    if (!error) {
      this.setState({ count: count, loaded: (count < 20) ? count : 20 });
    }
  }

  /**
   * Handle scrolling that loads more documents.
   *
   * @param {Object} error - The error
   * @param {Array} documents - The loaded documents.
   */
  handleLoadMore(error, documents) {
    if (!error) {
      this.setState({ loaded: this.state.loaded + documents.length });
    }
  }

  /**
   * Handle refreshing the document list.
   */
  handleRefreshDocuments() {
    this.refreshDocumentsAction();
  }

  /**
   * Switch between table and list document views.
   *
   * @param {String} view - The active view.
   */
  switchDocumentView(view) {
    this.props.viewSwitchHandler(view);
  }

  _loadedMessage() {
    if (this.state.count > 20) {
      return (
        <span>
          Displaying documents <b>1-{this.state.loaded}</b>&nbsp;
        </span>
      );
    }
  }

  /**
   * If we are on the documents tab, just display the count and insert button.
   *
   * @returns {React.Component} The count message.
   */
  renderQueryMessage() {
    const noun = pluralize('document', this.state.count);
    return (
      <div>
        <div className={ACTION_BAR_CLASS}>
          <div className={MESSAGE_CLASS}>
            Query returned&nbsp;<b>{this.state.count}</b>&nbsp;{noun}.&nbsp;
            {this._loadedMessage()}
            <InfoSprinkle
              helpLink={HELP_URLS.DOCUMENTS}
              onClickHandler={shell.openExternal}
            />
          </div>
          <div className={REFRESH_CLASS}>
            <AnimatedIconTextButton
              clickHandler={this.handleRefreshDocuments.bind(this)}
              stopAnimationListenable={ResetDocumentListStore}
              dataTestId="refresh-documents-button"
              className="btn btn-default btn-xs sampling-message-refresh-documents"
              iconClassName="fa fa-repeat"
              animatingIconClassName="fa fa-refresh fa-spin"
              text="&nbsp;Refresh" />
          </div>
        </div>
        <div className={ACTION_BAR_CLASS}>
          <this.TextWriteButton
            className="btn btn-primary btn-xs open-insert"
            dataTestId="open-insert-document-modal-button"
            isCollectionLevel
            text="Insert Document"
            tooltipId="document-is-not-writable"
            clickHandler={this.props.insertHandler} />
          <div className={VIEW_SWITCHER_CLASS}>
            <ViewSwitcher
              label="View"
              buttonLabels={['List', 'Table']}
              iconClassNames={['fa fa-list-ul', 'fa fa-table']}
              activeButton={this.props.activeDocumentView}
              onClick={this.switchDocumentView.bind(this)} />
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render the sampling message.
   *
   * @returns {React.Component} The document list.
   */
  render() {
    return this.renderQueryMessage();
  }
}

Toolbar.displayName = 'Toolbar';

Toolbar.propTypes = {
  activeDocumentView: PropTypes.string.isRequired,
  insertHandler: PropTypes.func.isRequired,
  viewSwitchHandler: PropTypes.func.isRequired
};

module.exports = Toolbar;
