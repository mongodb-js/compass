const React = require('react');
const app = require('ampersand-app');
const TextButton = require('hadron-app-registry').TextButton;
const numeral = require('numeral');
const pluralize = require('pluralize');

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
    this.state = { count: 0, loaded: 20 };
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.resetDocumentListStore = app.appRegistry.getStore('CRUD.ResetDocumentListStore');
    this.insertDocumentStore = app.appRegistry.getStore('CRUD.InsertDocumentStore');
    this.documentRemovedAction = app.appRegistry.getAction('CRUD.Actions').documentRemoved;
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
    this.setState({ count: this.state.count - 1 });
  }

  /**
   * Handle the reset of the document list.
   *
   * @param {Array} documents - The documents.
   * @param {Integer} count - The count.
   */
  handleReset(documents, count) {
    this.setState({ count: count, loaded: 20 });
  }

  /**
   * Handle scrolling that loads more documents.
   *
   * @param {Array} documents - The loaded documents.
   */
  handleLoadMore(documents) {
    this.setState({ loaded: this.state.loaded + documents.length });
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
        <i data-hook="schema-sampling-results" className="help"></i>
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
        </div>
        <div className="action-bar">
          {this.CollectionStore.isWritable() ?
            <TextButton
              clickHandler={this.props.insertHandler}
              dataTestId="open-insert-document-modal-button"
              className="btn btn-primary btn-xs open-insert"
              text="Insert Document" /> : null }
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
  sampleSize: React.PropTypes.number,
  insertHandler: React.PropTypes.func
};

module.exports = SamplingMessage;
