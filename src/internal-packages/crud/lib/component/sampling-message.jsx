'use strict';

const React = require('react');
const app = require('ampersand-app');
const ResetDocumentListStore = require('../store/reset-document-list-store');
const RemoveDocumentStore = require('../store/remove-document-store');
const InsertDocumentStore = require('../store/insert-document-store');
const OpenInsertDialogButton = require('./open-insert-dialog-button');

/**
 * The feature flag.
 */
const FEATURE = 'singleDocumentCrud';

/**
 * Component for the sampling message.
 */
class SamplingMessage extends React.Component {

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this.unsubscribeReset = ResetDocumentListStore.listen(this.handleReset.bind(this));
    // this.unsubscribeRemove = RemoveDocumentStore.listen(this.handleRemove.bind(this));
    // this.unsibscribeInsert = InsertDocumentStore.listen(this.handleInsert.bind(this));
  }

  /**
   * Unsibscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribeReset();
    // this.unsubscribeRemove();
    // this.unsubscribeInsert();
  }

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  /**
   * Handle the reset of the document list.
   *
   * @param {Array} documents - The documents.
   * @param {Integer} count - The count.
   */
  handleReset(documents, count) {
    this.setState({ count: count });
  }

  /**
   * Handles removal of a document from the document list.
   */
  handleRemove() {
    // this.setState({ count: this.state.count - 1 });
  }

  /**
   * Handle insert of a new document.
   *
   * @param {Boolean} success - If the insert was successful.
   * @param {Object} object - The new document or error.
   */
  handleInsert(success, object) {
    // if (success) {
      // this.setState({ count: this.state.count + 1 });
    // }
  }

  /**
   * Render the sampling message.
   *
   * @returns {React.Component} The document list.
   */
  render() {
    return (
      <div className='sampling-message'>
        Query returned&nbsp;<b>{this.state.count}</b>&nbsp;documents.
        <i data-hook='schema-sampling-results' className='help'></i>
        {this.renderInsertButton()}
      </div>
    );
  }

  /**
   * Render the insert button.
   */
  renderInsertButton() {
    if (app.isFeatureEnabled(FEATURE)) {
      return (<OpenInsertDialogButton handler={this.props.insertHandler} />);
    }
  }

  /**
   * Only update when the count changes.
   */
  shouldComponentUpdate(nextProps, nextState) {
    return nextState.count !== this.state.count;
  }
}

SamplingMessage.displayName = 'SamplingMessage';

module.exports = SamplingMessage;
