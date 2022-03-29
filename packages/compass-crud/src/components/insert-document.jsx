import React from 'react';
import PropTypes from 'prop-types';
import { DocumentList } from '@mongodb-js/compass-components';

/**
 * The class for the document itself.
 */
const DOCUMENT = 'document';

/**
 * Component for a single document in a list of documents.
 */
class InsertDocument extends React.PureComponent {
  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={DOCUMENT} data-test-id="insert-document-modal">
        <DocumentList.Document value={this.props.doc} editable editing />
      </div>
    );
  }
}

InsertDocument.displayName = 'InsertDocument';

InsertDocument.propTypes = {
  doc: PropTypes.object.isRequired,
  version: PropTypes.string.isRequired,
  tz: PropTypes.string
};

export default InsertDocument;
