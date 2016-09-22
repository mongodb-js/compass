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
   * Get the editable elements.
   *
   * @returns {Array} The editable elements.
   */
  renderElements() {
    const components = [];
    for (const element of this.doc.elements) {
      components.push(<EditableElement key={element.uuid} element={element} />);
    }
    components.push(<Hotspot key="hotspot" element={this.doc} />);
    return components;
  }

  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <ol className={LIST_CLASS}>
        <li className={LIST_ITEM_CLASS}>
          <ol className={DOCUMENT_CLASS}>
            <div className="document-elements">
              {this.renderElements(this.doc)}
            </div>
          </ol>
        </li>
      </ol>
    );
  }
}

InsertDocument.displayName = 'InsertDocument';

InsertDocument.propTypes = {
  doc: React.PropTypes.object
};

module.exports = InsertDocument;
