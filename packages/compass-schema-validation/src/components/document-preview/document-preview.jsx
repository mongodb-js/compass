import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Body } from '@mongodb-js/compass-components';
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
          data-testid="document-preview"
        >
          <div className={styles['document-preview-documents']}>
            <Body className={styles['no-documents']}>No Preview Documents</Body>
          </div>
        </div>
      );
    }

    return (
      <div
        className={styles['document-preview']}
        data-testid="document-preview"
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
