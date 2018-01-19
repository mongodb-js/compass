const React = require('react');
const PropTypes = require('prop-types');
const { AnimatedIconTextButton, IconButton } = require('hadron-react-buttons');
const { InfoSprinkle, ViewSwitcher } = require('hadron-react-components');
const { shell } = require('electron');
const ResetDocumentListStore = require('../stores/reset-document-list-store');
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
    this.state = { loaded: 0 };
    this.TextWriteButton = global.hadronApp.appRegistry.getComponent('DeploymentAwareness.TextWriteButton');
  }

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this.unsubscribeReset = ResetDocumentListStore.listen(this.handleReset.bind(this));
    this.unsubscribeInsert = InsertDocumentStore.listen(this.handleInsert.bind(this));
    this.unsubscribeRemove = this.props.documentRemoved.listen(this.handleRemove.bind(this));
    this.unsubscribePageChanged = PageChangedStore.listen(this.handlePageChange.bind(this));
  }

  /**
   * Unsubscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribeReset();
    this.unsubscribeInsert();
    this.unsubscribeRemove();
    this.unsubscribePageChanged();
  }

  /**
   * Hook for triggering a collection export.
   */
  handleExport() {
    global.hadronApp.appRegistry.emit('request-collection-export');
  }

  /**
   * Handle updating the count on document insert.
   *
   * @param {Error} error - If an error occurred.
   */
  handleInsert(error) {
    if (!error) {
      this.setState({ loaded: this.state.loaded + 1 });
    }
  }

  /**
   * Handle updating the count on document removal.
   */
  handleRemove() {
    this.setState({ loaded: this.state.loaded - 1 });
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
        loaded: (count < 20) ? count : 20
      });
    }
  }

  /**
   * The user has switched the page, starting with `start` and ending with `end`.
   *
   * @param {Object} error - The error
   * @param {Array} documents - The loaded documents.
   * @param {Number} start - The index of the first document on the page.
   * @param {Number} end - The index of the last document on the page.
   */
  handlePageChange(error, documents, start, end) {
    if (!error) {
      this.setState({ loaded: end });
    }
  }

  /**
   * Handle refreshing the document list.
   */
  handleRefreshDocuments() {
    this.props.refreshDocuments();
  }

  /**
   * Handle loading the next page of documents in the table view.
   */
  handleNextPage() {
    this.props.getNextPage(this.props.page + 1);
  }

  /**
   * Handle loading the previous page of documents in the table view.
   */
  handlePrevPage() {
    if (this.props.start - 20 <= 0) {
      return;
    }
    this.props.getPrevPage(this.props.page - 1);
  }

  /**
   * Switch between table and list document views.
   *
   * @param {String} view - The active view.
   */
  switchDocumentView(view) {
    this.props.viewSwitchHandler(view);
    this.props.refreshDocuments();
  }

  _loadedMessage() {
    return (
      <span>
        Displaying documents <b>{this.props.start} - {this.state.loaded}</b> of {this.props.count}
      </span>
    );
  }

  renderPageButtons() {
    const prevButtonDisabled = this.props.page === 0;
    const nextButtonDisabled = 20 * (this.props.page + 1) >= this.props.count;

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

  renderInsertButton() {
    if (!this.props.readonly) {
      return (
        <this.TextWriteButton
          className="btn btn-primary btn-xs open-insert"
          dataTestId="open-insert-document-modal-button"
          isCollectionLevel
          text="Insert Document"
          tooltipId="document-is-not-writable"
          clickHandler={this.props.insertHandler} />
      );
    }
  }

  renderExportButton() {
    return (
      <IconButton
        title="Export Collection"
        className="btn btn-default btn-xs"
        iconClassName="fa fa-download"
        clickHandler={this.handleExport} />
    );
  }

  /**
   * If we are on the documents tab, just display the count and insert button.
   *
   * @returns {React.Component} The count message.
   */
  renderQueryMessage() {
    return (
      <div>
        <div className={ACTION_BAR_CLASS}>
          <div className={CONTAINER_CLASS}>
            {this.renderInsertButton()}
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
            {this.renderExportButton()}
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
  viewSwitchHandler: PropTypes.func.isRequired,
  documentRemoved: PropTypes.func.isRequired,
  refreshDocuments: PropTypes.func.isRequired,
  getNextPage: PropTypes.func.isRequired,
  getPrevPage: PropTypes.func.isRequired,
  closeAllMenus: PropTypes.func.isRequired,
  readonly: PropTypes.bool.isRequired,
  count: PropTypes.number.isRequired,
  start: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired
};

module.exports = Toolbar;
