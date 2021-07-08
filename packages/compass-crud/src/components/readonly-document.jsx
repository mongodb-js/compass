import React from 'react';
import PropTypes from 'prop-types';

import DocumentActions from './document-actions';
import Element from './element';
import ExpansionBar from './expansion-bar';

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
  // constructor(props) {
  //   super(props);
  //   // this.props.doc = props.doc;
  //   this.
  // }

  // componentWillReceiveProps(nextProps) {
  //   if (this.props.doc !== nextProps.doc) {
  //     this.props.doc = nextProps.doc;
  //   }
  // }
  state = {
    renderSize: INITIAL_FIELD_LIMIT
  };

  setRenderSize(newLimit) {
    this.setState({ renderSize: newLimit });
  }

  handleClone = () => {
    this.props.openInsertDocumentDialog(this.props.doc.generateObject(), true);
  }

  /**
   * Handle copying JSON to clipboard of the document.
   */
  handleCopy = () => {
    this.props.copyToClipboard(this.props.doc);
  }

  /**
   * Get the elements for the document.
   *
   * @returns {Array} The elements.
   */
  renderElements() {
    const components = [];
    let index = 0;
    for (const element of this.props.doc.elements) {
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
    const totalSize = this.props.doc.elements.size;
    return (
      <ExpansionBar
        initialSize={INITIAL_FIELD_LIMIT}
        renderSize={this.state.renderSize}
        setRenderSize={this.setRenderSize.bind(this)}
        totalSize={totalSize}
      />
    );
  }

  renderActions() {
    return (
      <DocumentActions
        copy={this.props.copyToClipboard ? this.handleCopy : undefined}
        clone={this.props.openInsertDocumentDialog ? this.handleClone : undefined}
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
          {this.renderActions()}
        </div>
      </div>
    );
  }
}

ReadonlyDocument.displayName = 'ReadonlyDocument';

ReadonlyDocument.propTypes = {
  copyToClipboard: PropTypes.func,
  doc: PropTypes.object.isRequired,
  expandAll: PropTypes.bool,
  openInsertDocumentDialog: PropTypes.func,
  tz: PropTypes.string
};

export default ReadonlyDocument;
