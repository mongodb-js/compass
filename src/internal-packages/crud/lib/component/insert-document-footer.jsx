'use strict';

const React = require('react');
const InsertDocumentStore = require('../store/insert-document-store');
const Actions = require('../actions');

const INSERTING = 'Inserting Document';

/**
 * Map of modes to styles.
 */
const MODES = {
  'Progress': 'in-progress',
  'Error': 'error',
  'Modifying': 'modifying'
}

/**
 * Component for the insert document footer.
 */
class InsertDocumentFooter extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { message: '', mode: 'Modifying' };
  }

  /**
   * Subscribe to the insert document store.
   */
  componentWillMount() {
    this.unsubscribeInsert = InsertDocumentStore.listen(this.handleDocumentInsert.bind(this));
    this.unsubscribeStart = Actions.insertDocument.listen(this.handleInsertStart.bind(this));
  }

  /**
   * Unsubscribe from the store.
   */
  componentWillUnmount() {
    this.unsubscribeInsert();
    this.unsubscribeStart();
  }

  /**
   * Handles completion of document insert.
   *
   * @param {Boolean} success - If the operation succeeded.
   * @param {Object} doc - The document or error.
   */
  handleDocumentInsert(success, doc) {
    if (!success) {
      this.setState({ message: doc.message, mode: 'Error' });
    }
  }

  /**
   * Handles the start of a document insert.
   */
  handleInsertStart() {
    this.setState({ message: INSERTING, mode: 'Progess' });
  }

  /**
   * Get the style of the footer based on the current mode.
   *
   * @returns {String} The style.
   */
  style() {
    return `document-footer ${MODES[this.state.mode]}`;
  }

  /**
   * Render the footer.
   *
   * @returns {Component} The footer component.
   */
  render() {
    return (
      <div className={this.style()}>
        <div className='edit-message' title={this.state.message}>
          {this.state.message}
        </div>
      </div>
    );
  }
}

InsertDocumentFooter.displayName = 'InsertDocumentFooter';

module.exports = InsertDocumentFooter;
