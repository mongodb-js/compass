'use strict';

const _ = require('lodash');
const React = require('react');
const Element = require('hadron-document').Element;
const EditableElement = require('./editable-element');
const Hotspot = require('./hotspot');

/**
 * The class for the document itself.
 */
const DOCUMENT_CLASS = 'document-property-body';

/**
 * The full document list container class.
 */
const LIST_CLASS = 'document-list';

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
    this.doc.on(Element.Events.Added, this.handleModify.bind(this));
    this.doc.on(Element.Events.Removed, this.handleModify.bind(this));
  }

  /**
   * Handle modifications to the document.
   */
  handleModify() {
    this.setState({});
  }

  /**
   * Render a single document list item.
   */
  render() {
    return (
      <ol className={LIST_CLASS}>
        <li className={LIST_ITEM_CLASS}>
          <ol className={DOCUMENT_CLASS}>
            <div className='document-elements'>
              {this.renderElements(this.doc)}
            </div>
          </ol>
        </li>
      </ol>
    );
  }

  /**
   * Get the editable elements.
   *
   * @returns {Array} The editable elements.
   */
  renderElements() {
    var components = [];
    for (let element of this.doc.elements) {
      components.push(<EditableElement key={element.uuid} element={element} />)
    }
    // Add the hotspot to the end. In the case of insert, we need to guard against
    // No elements being present.
    var lastComponent = components[components.length - 1];
    var lastElement = lastComponent ? lastComponent.props.element : this.state.doc;
    components.push(<Hotspot key='hotspot' element={lastElement} />);
    return components;
  }
}

InsertDocument.displayName = 'InsertDocument';

module.exports = InsertDocument;
