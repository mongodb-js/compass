const React = require('react');
const ElementFactory = require('hadron-app-registry').ElementFactory;

/**
 * Component for a single readonly document in a list of documents.
 */
class ReadonlyDocument extends React.Component {

  /**
   * Get the elements for the document.
   *
   * @returns {Array} The elements.
   */
  renderElements() {
    return ElementFactory.elements(this.props.doc, this.props.preExpanded || false);
  }

  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className="document">
        <ol className="document-elements">
          {this.renderElements()}
        </ol>
      </div>
    );
  }
}

ReadonlyDocument.displayName = 'ReadonlyDocument';

ReadonlyDocument.propTypes = {
  doc: React.PropTypes.object.isRequired,
  preExpanded: React.PropTypes.bool
};

module.exports = ReadonlyDocument;
