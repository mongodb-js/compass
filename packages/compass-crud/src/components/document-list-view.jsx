const _ = require('lodash');
const React = require('react');
const PropTypes = require('prop-types');
const Document = require('./document');

/**
 * The full document list container class.
 */
const LIST_CLASS = 'document-list';

/**
 * The list item class.
 */
const LIST_ITEM_CLASS = `${LIST_CLASS}-item`;

/**
 * The list item test id.
 */
const LIST_ITEM_TEST_ID = LIST_ITEM_CLASS;

/**
 * The scroll event name.
 */
const SCROLL_EVENT = 'scroll';

/**
 * Represents the list view of the documents tab.
 */
class DocumentListView extends React.Component {

  /**
   * Attach the scroll event, for now.
   */
  componentDidMount() {
    this.attachScrollEvent();
  }

  /**
   * Attach the scroll event to the parent container.
   */
  attachScrollEvent() {
    this.refs.documentList.parentNode.parentNode.addEventListener(
      SCROLL_EVENT,
      this.props.scrollHandler
    );
  }

  /**
   * Get the document list item components.
   *
   * @param {Array} docs - The raw documents.
   *
   * @return {Array} The document list item components.
   */
  renderDocuments() {
    return _.map(this.props.docs, (doc) => {
      return (
        <li className={LIST_ITEM_CLASS} data-test-id={LIST_ITEM_TEST_ID} key={doc._id}>
          <Document doc={doc} key={doc._id} editable={this.props.isEditable} />
        </li>
      );
    });
  }

  /**
   * Render the document list view.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <ol className={LIST_CLASS} ref="documentList">
        {this.renderDocuments()}
      </ol>
    );
  }
}

DocumentListView.propTypes = {
  docs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool.isRequired,
  scrollHandler: PropTypes.func.isRequired
};

DocumentListView.displayName = 'DocumentListView';

module.exports = DocumentListView;
