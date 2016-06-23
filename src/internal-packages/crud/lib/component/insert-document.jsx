'use strict';

const _ = require('lodash');
const React = require('react');
const EditableElement = require('./editable-element');
const Hotspot = require('./hotspot');

/**
 * The class for the document itself.
 */
const DOCUMENT_CLASS = 'document-property-body';

/**
 * The class for the list item wrapper.
 */
const LIST_ITEM_CLASS = 'document-list-item';

/**
 * Component for a single document in a list of documents.
 */
class InsertDocument extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.doc = props.doc;
  }

  /**
   * Render a single document list item.
   */
  render() {
    return (
      <li className={LIST_ITEM_CLASS}>
        <ol className={DOCUMENT_CLASS}>
          <div className='document-elements'>
            {this.renderElements(this.doc)}
          </div>
        </ol>
      </li>
    );
  }

  /**
   * Get the editable elements.
   *
   * @returns {Array} The editable elements.
   */
  renderElements() {
    var elements = _.map(this.doc.elements, (element) => {
      return (
        <EditableElement key={element.uuid} element={element} />
      );
    });
    var lastElement = elements[elements.length - 1].props.element;
    elements.push(<Hotspot key='hotspot' element={lastElement} />);
    return elements;
  }
}

InsertDocument.displayName = 'InsertDocument';

module.exports = InsertDocument;
