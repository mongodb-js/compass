const React = require('react');
const HadronDocument = require('hadron-document');
const Element = require('./element');

/**
 * The base class.
 */
const BASE = 'document';

/**
 * The elements class.
 */
const ELEMENTS = `${BASE}-elements`;

/**
 * The test id.
 */
const TEST_ID = 'readonly-document';

/**
 * Component for a single readonly document in a list of documents.
 */
class ReadonlyDocument extends React.Component {

  /**
   * Initialize the readonly document.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.doc = new HadronDocument(props.doc);
  }

  /**
   * Get the elements for the document.
   *
   * @returns {Array} The elements.
   */
  renderElements() {
    const components = [];
    for (const element of this.doc.elements) {
      components.push((
        <Element key={element.uuid} element={element} expandAll={this.props.expandAll} />
      ));
    }
    return components;
  }

  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={BASE} data-test-id={TEST_ID}>
        <ol className={ELEMENTS}>
          {this.renderElements()}
        </ol>
      </div>
    );
  }
}

ReadonlyDocument.displayName = 'ReadonlyDocument';

ReadonlyDocument.propTypes = {
  doc: React.PropTypes.object.isRequired,
  expandAll: React.PropTypes.bool
};

module.exports = ReadonlyDocument;
