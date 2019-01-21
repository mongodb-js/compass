import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Document } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';

import styles from './document-preview.less';

/**
 * The document preview component.
 */
class DocumentPreview extends Component {
  static displayName = 'DocumentPreview';

  static propTypes = { document: PropTypes.object }

  /**
   * Renders the document preview.
   *
   * @returns {React.Component} The component.
   */
  render() {
    if (!this.props.document) {
      return (
        <div className={classnames(styles['document-preview'])}>
          <div className={classnames(styles['document-preview-documents'])}>
            <div className={classnames(styles['no-documents'])}>
              <i>No Preview Documents</i>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={classnames(styles['document-preview'])}>
        <div className={classnames(styles['document-preview-documents'])}>
          <Document
            doc={new HadronDocument(this.props.document)}
            editable={false}
            tz="UTC" />
        </div>
      </div>
    );
  }
}

export default DocumentPreview;
