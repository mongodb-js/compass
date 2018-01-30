import React from 'react';
import PropTypes from 'prop-types';
import Element from 'components/element';
import ExpansionBar from 'components/expansion-bar';

/**
 * The base class.
 */
const BASE = 'document';

/**
 * The contents class.
 */
const CONTENTS = `${BASE}-contents`;

/**
 * The elements class.
 */
const ELEMENTS = `${BASE}-elements`;

/**
 * The initial field limit.
 */
const INITIAL_FIELD_LIMIT = 25;

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
    this.doc = props.doc;
    this.state = {
      renderSize: INITIAL_FIELD_LIMIT
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.doc !== nextProps.doc) {
      this.doc = nextProps.doc;
    }
  }

  setRenderSize(newLimit) {
    this.setState({ renderSize: newLimit });
  }

  /**
   * Get the elements for the document.
   *
   * @returns {Array} The elements.
   */
  renderElements() {
    const components = [];
    let index = 0;
    for (const element of this.doc.elements) {
      components.push((
        <Element
          key={element.uuid}
          element={element}
          expandAll={this.props.expandAll}
          tz={this.props.tz}
        />
      ));
      index++;
      if (index >= this.state.renderSize) {
        break;
      }
    }
    return components;
  }

  /**
   * Render the expander bar.
   *
   * @returns {React.Component} The expander bar.
   */
  renderExpansion() {
    const totalSize = this.doc.elements.size;
    return (
      <ExpansionBar
        initialSize={INITIAL_FIELD_LIMIT}
        renderSize={this.state.renderSize}
        setRenderSize={this.setRenderSize.bind(this)}
        totalSize={totalSize}
      />
    );
  }

  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={BASE} data-test-id={TEST_ID}>
        <div className={CONTENTS}>
          <ol className={ELEMENTS}>
            {this.renderElements()}
          </ol>
          {this.renderExpansion()}
        </div>
      </div>
    );
  }
}

ReadonlyDocument.displayName = 'ReadonlyDocument';

ReadonlyDocument.propTypes = {
  doc: PropTypes.object.isRequired,
  expandAll: PropTypes.bool,
  tz: PropTypes.string
};

export default ReadonlyDocument;
