import React from 'react';
import PropTypes from 'prop-types';
import { ViewSwitcher } from 'hadron-react-components';
import { AnimatedIconTextButton } from 'hadron-react-buttons';

const BASE_CLASS = 'document-list';
const ACTION_BAR_CLASS = `${BASE_CLASS}-action-bar`;
const CONTAINER_CLASS = `${ACTION_BAR_CLASS}-container`;
const MESSAGE_CLASS = `${ACTION_BAR_CLASS}-message`;
const REFRESH_CLASS = `${ACTION_BAR_CLASS}-refresh`;
const PAGINATION_CLASS = `${ACTION_BAR_CLASS}-pagination`;
const VIEW_SWITCHER_CLASS = `${ACTION_BAR_CLASS}-view-switcher`;
const INSERT_DATA = `btn-primary ${ACTION_BAR_CLASS}-insert-data`;
const INSERT_DATA_TITLE = `${ACTION_BAR_CLASS}-insert-data-title`;

/**
 * Component for the CRUD toolbar.
 */
class Toolbar extends React.Component {
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
        Displaying documents <b>{this.props.start} - {this.props.end}</b> of {this.props.count || 'N/A'}
      </span>
    );
  }

  renderPageButtons() {
    const prevButtonDisabled = this.props.page === 0;
    const nextButtonDisabled = this.props.count ? 20 * (this.props.page + 1) >= this.props.count : false;

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
      const dropdownOptions = { 'import-file': 'Import File', 'insert-document': 'Insert Document' };
      const OptionWriteSelector = global.hadronApp.appRegistry.
        getComponent('DeploymentAwareness.OptionWriteSelector');
      return (
        <OptionWriteSelector
          className={INSERT_DATA}
          id="insert-data-dropdown"
          isCollectionLevel
          title={<div className={INSERT_DATA_TITLE}><i className="fa fa-download"/><div>ADD DATA</div></div>}
          options={dropdownOptions}
          bsSize="xs"
          tooltipId="document-is-not-writable"
          onSelect={this.props.insertHandler} />
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
                buttonLabels={['List', 'JSON', 'Table']}
                showLabels={false}
                iconClassNames={['fa fa-list-ul', 'curly-bracket', 'fa fa-table']}
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
                animatingIconClassName="fa fa-refresh fa-spin"/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Toolbar.displayName = 'Toolbar';

Toolbar.propTypes = {
  activeDocumentView: PropTypes.string.isRequired,
  count: PropTypes.number,
  end: PropTypes.number.isRequired,
  getNextPage: PropTypes.func.isRequired,
  getPrevPage: PropTypes.func.isRequired,
  insertHandler: PropTypes.func,
  isExportable: PropTypes.bool.isRequired,
  page: PropTypes.number.isRequired,
  readonly: PropTypes.bool.isRequired,
  refreshDocuments: PropTypes.func.isRequired,
  start: PropTypes.number.isRequired,
  viewSwitchHandler: PropTypes.func.isRequired,
  pageLoadedListenable: PropTypes.object.isRequired
};

export default Toolbar;
