'use strict';

const React = require('react');
const app = require('ampersand-app');
const TextButton = require('hadron-app-registry').TextButton;

/**
 * Component for the sampling message.
 */
class SamplingMessage extends React.Component {

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this.unsubscribeReset = this.resetDocumentListStore.listen(this.handleReset.bind(this));
    this.unsubscribeInsert = this.insertDocumentStore.listen(this.handleInsert.bind(this));
    this.unsubscribeRemove = this.documentRemovedAction.listen(this.handleRemove.bind(this));
  }

  /**
   * Unsibscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribeReset();
    this.unsubscribeInsert();
    this.unsubscribeRemove();
  }

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { count: 0 };
    this.resetDocumentListStore = app.appRegistry.getStore('Store::CRUD::ResetDocumentListStore');
    this.insertDocumentStore = app.appRegistry.getStore('Store::CRUD::InsertDocumentStore');
    this.documentRemovedAction = app.appRegistry.getAction('Action::CRUD::DocumentRemoved');
  }

  /**
   * Handle updating the count on document insert.
   */
  handleInsert() {
    this.setState({ count: this.state.count + 1 });
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
    this.setState({ count: count });
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

  renderInsertButton() {
    if (this.props.insertHandler) {
      return (
        <TextButton
          clickHandler={this.props.insertHandler}
          className='btn btn-default btn-xs open-insert'
          text='+ Insert' />
      );
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
