'use strict';

const React = require('react');
const ResetDocumentListStore = require('../store/reset-document-list-store');
const TextButton = require('./text-button');

/**
 * Component for the sampling message.
 */
class SamplingMessage extends React.Component {

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this.unsubscribeReset = ResetDocumentListStore.listen(this.handleReset.bind(this));
  }

  /**
   * Unsibscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribeReset();
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
   * Render the sampling message.
   *
   * @returns {React.Component} The document list.
   */
  render() {
    return (
      <div className='sampling-message'>
        Query returned&nbsp;<b>{this.state.count}</b>&nbsp;documents.
        <i data-hook='schema-sampling-results' className='help'></i>
        <TextButton
          clickHandler={this.props.insertHandler}
          className='btn btn-default btn-xs open-insert'
          text='+ Insert' />
      </div>
    );
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
