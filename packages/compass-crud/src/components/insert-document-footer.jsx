const _ = require('lodash');
const React = require('react');
const InsertDocumentStore = require('../stores/insert-document-store');
const Actions = require('../actions');

const INSERTING = 'Inserting Document';

/**
 * The invalid message.
 */
const INVALID_MESSAGE = 'Insert not permitted while document contains errors.';

/**
 * Map of modes to styles.
 */
const MODES = {
  'Progress': 'is-in-progress',
  'Error': 'is-error',
  'Viewing': 'is-viewing',
  'Modifying': 'is-modifying'
};

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
    this.invalidElements = [];
    this.unsubscribeInsert = InsertDocumentStore.listen(this.handleDocumentInsert.bind(this));
    this.unsubscribeStart = Actions.insertDocument.listen(this.handleInsertStart.bind(this));
    this.unsubscribeInvalid = Actions.elementInvalid.listen(this.handleInvalid.bind(this));
    this.unsubscribeValid = Actions.elementValid.listen(this.handleValid.bind(this));
  }

  /**
   * Unsubscribe from the store.
   */
  componentWillUnmount() {
    this.invalidElements = [];
    this.unsubscribeInsert();
    this.unsubscribeStart();
    this.unsubscribeInvalid();
    this.unsubscribeValid();
  }

  /**
   * Handles completion of document insert.
   *
   * @param {Error} error - Any insert error.
   */
  handleDocumentInsert(error) {
    if (error) {
      this.setState({ message: error.message, mode: 'Error' });
    }
  }

  /**
   * Handles the start of a document insert.
   */
  handleInsertStart() {
    this.setState({ message: INSERTING, mode: 'Progess' });
  }

  handleValid(uuid) {
    _.pull(this.invalidElements, uuid);
    if (!this.hasErrors()) {
      this.handleInsertStart();
    }
  }

  handleInvalid(uuid) {
    if (!_.includes(this.invalidElements, uuid)) {
      this.invalidElements.push(uuid);
      this.setState({ message: INVALID_MESSAGE, mode: 'Error' });
    }
  }

  hasErrors() {
    return this.invalidElements.length > 0;
  }

  /**
   * Get the style of the footer based on the current mode.
   *
   * @returns {String} The style.
   */
  style() {
    return `document-footer document-footer-${MODES[this.state.mode]}`;
  }

  /**
   * Render the footer.
   *
   * @returns {Component} The footer component.
   */
  render() {
    return (
      <div className={this.style()}>
        <div className="document-footer-message" title={this.state.message}>
          {this.state.message}
        </div>
      </div>
    );
  }
}

InsertDocumentFooter.displayName = 'InsertDocumentFooter';

module.exports = InsertDocumentFooter;
