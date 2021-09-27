const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const { AnimatedIconTextButton, TextButton } = require('hadron-react-buttons');
const { InfoSprinkle } = require('hadron-react-components');
const { shell } = require('electron');
const numeral = require('numeral');
const pluralize = require('pluralize');

/**
 * The help URLs for things like the Documents tab.
 */
const HELP_URLS = Object.freeze({
  DOCUMENTS: 'https://docs.mongodb.com/compass/master/documents/',
  SCHEMA_SAMPLING: 'https://docs.mongodb.com/compass/current/faq/#what-is-sampling-and-why-is-it-used'
});

/**
 * Component for the sampling message.
 */
class SamplingMessage extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    const crudActions = app.appRegistry.getAction('CRUD.Actions');
    this.state = { count: 0, loaded: 0 };
    this.resetDocumentListStore = app.appRegistry.getStore('CRUD.ResetDocumentListStore');
    this.insertDocumentStore = app.appRegistry.getStore('CRUD.InsertDocumentStore');
    this.documentRemovedAction = crudActions.documentRemoved;
    this.refreshDocumentsAction = crudActions.refreshDocuments;
    this.loadMoreDocumentsStore = app.appRegistry.getStore('CRUD.LoadMoreDocumentsStore');
  }

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this.unsubscribeReset = this.resetDocumentListStore.listen(this.handleReset.bind(this));
    this.unsubscribeInsert = this.insertDocumentStore.listen(this.handleInsert.bind(this));
    this.unsubscribeRemove = this.documentRemovedAction.listen(this.handleRemove.bind(this));
    this.unsubscribeLoadMore = this.loadMoreDocumentsStore.listen(this.handleLoadMore.bind(this));
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
   * @param {Boolean} success - If the insert succeeded.
   */
  handleInsert(success) {
    if (success) {
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

  _loadedMessage() {
    if (this.state.count > 20) {
      return (
        <span>
          Displaying documents <b>1-{this.state.loaded}</b>&nbsp;
        </span>
      );
    }
  }

  _samplePercentage() {
    const percent = (this.state.count === 0) ? 0 : this.props.sampleSize / this.state.count;
    return numeral(percent).format('0.00%');
  }

  /**
   * If we are on the schema tab, the smapling message is rendered.
   *
   * @returns {React.Component} The sampling message.
   */
  renderSamplingMessage() {
    const noun = pluralize('document', this.state.count);
    return (
      <div className="sampling-message">
        Query returned&nbsp;
        <b>{this.state.count}</b>&nbsp;{noun}.
        This report is based on a sample of&nbsp;
        <b>{this.props.sampleSize}</b>&nbsp;{noun} ({this._samplePercentage()}).
        <InfoSprinkle
          helpLink={HELP_URLS.SCHEMA_SAMPLING}
          onClickHandler={shell.openExternal}
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
        <div className="sampling-message">
          Query returned&nbsp;<b>{this.state.count}</b>&nbsp;{noun}.&nbsp;
          {this._loadedMessage()}
          <InfoSprinkle
            helpLink={HELP_URLS.DOCUMENTS}
            onClickHandler={shell.openExternal}
          />
          <AnimatedIconTextButton
            clickHandler={this.handleRefreshDocuments.bind(this)}
            stopAnimationListenable={this.resetDocumentListStore}
            dataTestId="refresh-documents-button"
            className="btn btn-default btn-xs sampling-message-refresh-documents"
            iconClassName="fa fa-repeat"
            animatingIconClassName="fa fa-refresh fa-spin"
            text="&nbsp;Refresh" />
        </div>
        <div className="action-bar">
          <TextButton
            className="btn btn-primary btn-xs open-insert"
            dataTestId="open-insert-document-modal-button"
            text="Insert Document"
            tooltipId="document-is-not-writable"
            clickHandler={this.props.insertHandler} />
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
    if (this.props.insertHandler) {
      return this.renderQueryMessage();
    }
    return this.renderSamplingMessage();
  }
}

SamplingMessage.displayName = 'SamplingMessage';

SamplingMessage.propTypes = {
  sampleSize: PropTypes.number,
  insertHandler: PropTypes.func
};

module.exports = SamplingMessage;
