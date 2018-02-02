import React from 'react';
import PropTypes from 'prop-types';
import { AnimatedIconTextButton, IconButton } from 'hadron-react-buttons';
import { ViewSwitcher } from 'hadron-react-components';

import classnames from 'classnames';
import styles from './toolbar.less';

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
        Displaying documents <b>{this.props.start} - {this.props.end}</b> of {this.props.count}
      </span>
    );
  }

  renderPageButtons() {
    const prevButtonDisabled = this.props.page === 0;
    const nextButtonDisabled = 20 * (this.props.page + 1) >= this.props.count;
    const paginationClassName = classnames(styles['toolbar-pagination']);
    const paginationButtonClassName = classnames(styles['toolbar-pagination-button']);
    const paginationButtonLeftClassName = classnames(styles['toolbar-pagination-button-left']);
    const paginationButtonRightClassName = classnames(styles['toolbar-pagination-button-right']);

    return (
      <div className={paginationClassName}>
        <AnimatedIconTextButton
          clickHandler={this.handlePrevPage.bind(this)}
          stopAnimationListenable={this.props.pageLoadedListenable}
          className={`btn btn-default btn-xs ${paginationButtonClassName} ${paginationButtonLeftClassName}`}
          iconClassName="fa fa-chevron-left"
          animatingIconClassName="fa fa-spinner fa-spin"
          disabled={prevButtonDisabled}
        />
        <AnimatedIconTextButton
          clickHandler={this.handleNextPage.bind(this)}
          stopAnimationListenable={this.props.pageLoadedListenable}
          className={`btn btn-default btn-xs ${paginationButtonClassName} ${paginationButtonRightClassName}`}
          iconClassName="fa fa-chevron-right"
          animatingIconClassName="fa fa-spinner fa-spin"
          disabled={nextButtonDisabled}
        />
      </div>
    );
  }

  renderInsertButton() {
    if (!this.props.readonly) {
      const TextWriteButton = global.hadronApp.appRegistry.
        getComponent('DeploymentAwareness.TextWriteButton');
      return (
        <TextWriteButton
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
    const actionBarClassName = classnames(styles['toolbar-action-bar']);
    const containerClassName = classnames(styles['toolbar-action-bar-container']);
    const messageClassName = classnames(styles['toolbar-action-bar-message']);
    const refreshClassName = classnames(styles['toolbar-refresh']);
    const viewSwitcherClassName = classnames(styles['toolbar-action-bar-view-switcher']);
    return (
      <div>
        <div className={actionBarClassName}>
          <div className={containerClassName}>
            {this.renderInsertButton()}
            <div className={viewSwitcherClassName}>
              <ViewSwitcher
                label="View"
                buttonLabels={['List', 'Table']}
                iconClassNames={['fa fa-list-ul', 'fa fa-table']}
                activeButton={this.props.activeDocumentView}
                onClick={this.switchDocumentView.bind(this)} />
            </div>
          </div>
          <div className={containerClassName}>
            <div className={messageClassName}>
              {this._loadedMessage()}
            </div>
            {this.renderPageButtons()}
            <div className={refreshClassName}>
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

export default Toolbar;
