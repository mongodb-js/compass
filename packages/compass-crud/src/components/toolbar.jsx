const React = require('react');
const PropTypes = require('prop-types');
const { AnimatedIconTextButton } = require('hadron-react-buttons');
const { InfoSprinkle, ViewSwitcher } = require('hadron-react-components');
const { shell } = require('electron');
const pluralize = require('pluralize');
const Actions = require('../actions');
const ResetDocumentListStore = require('../stores/reset-document-list-store');
const LoadMoreDocumentsStore = require('../stores/load-more-documents-store');
const InsertDocumentStore = require('../stores/insert-document-store');
const PageChangedStore = require('../stores/page-changed-store');

/**
 * The help URLs for things like the Documents tab.
 */
const HELP_URLS = Object.freeze({
  DOCUMENTS: 'https://docs.mongodb.com/compass/master/documents/',
  SCHEMA_SAMPLING: 'https://docs.mongodb.com/compass/current/faq/#what-is-sampling-and-why-is-it-used'
});

const BASE_CLASS = 'document-list';
const ACTION_BAR_CLASS = `${BASE_CLASS}-action-bar`;
const CONTAINER_CLASS = `${ACTION_BAR_CLASS}-container`;
const MESSAGE_CLASS = `${ACTION_BAR_CLASS}-message`;
const REFRESH_CLASS = `${ACTION_BAR_CLASS}-refresh`;
const PAGINATION_CLASS = `${ACTION_BAR_CLASS}-pagination`;
const VIEW_SWITCHER_CLASS = `${ACTION_BAR_CLASS}-view-switcher`;

/**
 * Component for the CRUD toolbar.
 */
class Toolbar extends React.Component {

  /**
   * The component constructor.
   *
   * state.count is the total number of documents available to this query.
   * state.loaded is the total number of documents that have been loaded already.
   * state.start is the first document being shown. For list view, it will always
   * be 1 and for table view it will be state.loaded - 20 (or 0).
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { count: 0, loaded: 0, start: 1, page: 0 };
    this.TextWriteButton = global.hadronApp.appRegistry.getComponent('DeploymentAwareness.TextWriteButton');
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
    this.unsubscribePageChanged = PageChangedStore.listen(this.handlePageChange.bind(this));
  }

  /**
   * Unsubscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribeReset();
    this.unsubscribeInsert();
    this.unsubscribeRemove();
    this.unsubscribeLoadMore();
    this.unsubscribePageChanged();
  }

  /**
   * Handle updating the count on document insert.
   *
   * @param {Error} error - If an error occurred.
   */
  handleInsert(error) {
    if (!error) {
      this.setState({ count: this.state.count + 1, loaded: this.state.loaded + 1 });
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
      this.setState({
        count: count,
        loaded: (count < 20) ? count : 20,
        start: 1,
        page: 0
      });
    }
  }

  /**
   * Handle a change in the visible documents. Can be a result of scroll, for
   * the list view, or a result of the next/previous buttons in the table view.
   * Updates the page counts.
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
   * The user has switched the page, starting with `start` and ending with `end`.
   *
   * @param {Object} error - The error
   * @param {Array} documents - The loaded documents.
   * @param {Number} start - The index of the first document on the page.
   * @param {Number} end - The index of the last document on the page.
   * @param {Number} page - The page that is being shown.
   */
  handlePageChange(error, documents, start, end, page) {
    if (!error) {
      this.setState({start: start, loaded: end, page: page});
    }
  }

  /**
   * Handle refreshing the document list.
   */
  handleRefreshDocuments() {
    this.refreshDocumentsAction();
  }

  /**
   * Handle loading the next page of documents in the table view.
   */
  handleNextPage() {
    Actions.getNextPage(this.state.page + 1);
  }

  /**
   * Handle loading the previous page of documents in the table view.
   */
  handlePrevPage() {
    if (this.state.start - 20 <= 0) {
      return;
    }
    Actions.getPrevPage(this.state.page - 1);
  }

  /**
   * Switch between table and list document views.
   *
   * @param {String} view - The active view.
   */
  switchDocumentView(view) {
    this.props.viewSwitchHandler(view);
    Actions.refreshDocuments();
  }

  _loadedMessage() {
    if (this.state.count > 20) {
      return (
        <span>
          Displaying documents <b>{this.state.start}-{this.state.loaded}</b>&nbsp;
        </span>
      );
    }
  }

  renderPageButtons() {
    if (this.props.activeDocumentView === 'List') {
      return null;
    }

    const prevButtonDisabled = this.state.page === 0;
    const nextButtonDisabled = 20 * (this.state.page + 1) >= this.state.count;

    return (
      <div className={PAGINATION_CLASS}>
      <AnimatedIconTextButton
          clickHandler={this.handlePrevPage.bind(this)}
          stopAnimationListenable={PageChangedStore}
          className={`btn btn-default btn-xs ${PAGINATION_CLASS}-button ${PAGINATION_CLASS}-button-left`}
          iconClassName="fa fa-chevron-left"
          animatingIconClassName="fa fa-spinner fa-spin"
          disabled={prevButtonDisabled}
        />
        <AnimatedIconTextButton
          clickHandler={this.handleNextPage.bind(this)}
          stopAnimationListenable={PageChangedStore}
          className={`btn btn-default btn-xs ${PAGINATION_CLASS}-button ${PAGINATION_CLASS}-button-right`}
          iconClassName="fa fa-chevron-right"
          animatingIconClassName="fa fa-spinner fa-spin"
          disabled={nextButtonDisabled}
        />
      </div>
    );
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
          <div className={CONTAINER_CLASS}>
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
          <div className={CONTAINER_CLASS}>
            <div className={MESSAGE_CLASS}>
              <b>{this.state.count}</b>&nbsp;{noun}.&nbsp;
              {this._loadedMessage()}
              <InfoSprinkle
                helpLink={HELP_URLS.DOCUMENTS}
                onClickHandler={shell.openExternal}
              />
            </div>
            {this.renderPageButtons()}
            <div className={REFRESH_CLASS}>
              <AnimatedIconTextButton
                clickHandler={this.handleRefreshDocuments.bind(this)}
                stopAnimationListenable={ResetDocumentListStore}
                dataTestId="refresh-documents-button"
                className="btn btn-default btn-xs sampling-message-refresh-documents"
                iconClassName="fa fa-repeat"
                animatingIconClassName="fa fa-refresh fa-spin"
                />
            </div>
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
