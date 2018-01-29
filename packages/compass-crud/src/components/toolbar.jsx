const React = require('react');
const PropTypes = require('prop-types');
const { AnimatedIconTextButton, IconButton } = require('hadron-react-buttons');
const { ViewSwitcher } = require('hadron-react-components');

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
    this.TextWriteButton = global.hadronApp.appRegistry.getComponent('DeploymentAwareness.TextWriteButton');
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
        Displaying documents <b>{this.props.start} - {this.props.end}</b> of {this.props.count}
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
          stopAnimationListenable={this.props.pageLoadedListenable}
          className={`btn btn-default btn-xs ${PAGINATION_CLASS}-button ${PAGINATION_CLASS}-button-left`}
          iconClassName="fa fa-chevron-left"
          animatingIconClassName="fa fa-spinner fa-spin"
          disabled={prevButtonDisabled}
        />
        <AnimatedIconTextButton
          clickHandler={this.handleNextPage.bind(this)}
          stopAnimationListenable={this.props.pageLoadedListenable}
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

  renderImportButton() {
    if (this.props.isExportable) {
      return (
        <IconButton
          title="Import to Collection"
          className="btn btn-default btn-xs"
          iconClassName="fa fa-upload"
          clickHandler={this.props.openImport} />
      );
    }
  }

  renderExportButton() {
    if (this.props.isExportable) {
      return (
        <IconButton
          title="Export Collection"
          className="btn btn-default btn-xs"
          iconClassName="fa fa-download"
          clickHandler={this.props.openExport} />
      );
    }
  }

  /**
   * If we are on the documents tab, just display the count and insert button.
   *
   * @returns {React.Component} The component.
   */
  render() {
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
            </div>
            {this.renderPageButtons()}
            <div className={REFRESH_CLASS}>
              <AnimatedIconTextButton
                clickHandler={this.handleRefreshDocuments.bind(this)}
                stopAnimationListenable={this.props.pageLoadedListenable}
                dataTestId="refresh-documents-button"
                className="btn btn-default btn-xs sampling-message-refresh-documents"
                iconClassName="fa fa-repeat"
                animatingIconClassName="fa fa-refresh fa-spin"
                />
            </div>
            {this.renderImportButton()}
            {this.renderExportButton()}
          </div>
        </div>
      </div>
    );
  }
}

Toolbar.displayName = 'Toolbar';

Toolbar.propTypes = {
  activeDocumentView: PropTypes.string.isRequired,
  closeAllMenus: PropTypes.func,
  count: PropTypes.number.isRequired,
  end: PropTypes.number.isRequired,
  getNextPage: PropTypes.func.isRequired,
  getPrevPage: PropTypes.func.isRequired,
  insertHandler: PropTypes.func,
  isExportable: PropTypes.bool.isRequired,
  openExport: PropTypes.func,
  openImport: PropTypes.func,
  page: PropTypes.number.isRequired,
  readonly: PropTypes.bool.isRequired,
  refreshDocuments: PropTypes.func.isRequired,
  start: PropTypes.number.isRequired,
  viewSwitchHandler: PropTypes.func.isRequired,
  pageLoadedListenable: PropTypes.object.isRequired
};

module.exports = Toolbar;
