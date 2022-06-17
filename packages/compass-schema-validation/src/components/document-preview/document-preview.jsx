import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Document } from '@mongodb-js/compass-crud';

import styles from './document-preview.module.less';

/**
 * The document preview component.
 */
class DocumentPreview extends Component {
  static displayName = 'DocumentPreview';

  static propTypes = { document: PropTypes.object };

  /**
   * Renders the document preview.
   *
   * @returns {React.Component} The component.
   */
  render() {
    if (!this.props.document) {
      return (
        <div
          className={styles['document-preview']}
          data-test-id="document-preview"
        >
          <div className={styles['document-preview-documents']}>
            <div className={styles['no-documents']}>
              <i>No Preview Documents</i>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={styles['document-preview']}
        data-test-id="document-preview"
      >
        <div className={styles['document-preview-documents']}>
          <div className={styles['document-preview-document-card']}>
            <Document doc={this.props.document} editable={false} />
          </div>
        </div>
      </div>
    );
  }
}

export default DocumentPreview;
