import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Document } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';
import LoadingOverlay from '../loading-overlay';

import styles from './input-preview.module.less';

/**
 * The input preview component.
 */
class InputPreview extends Component {
  static displayName = 'InputPreview';

  static propTypes = {
    documents: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired
  }

  /**
   * Renders the input preview.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const documents = (this.props.documents || []).map((doc, i) => {
      return (
        <div key={i} className={styles['input-preview-document-card']}>
          <Document doc={new HadronDocument(doc)} editable={false}  />
        </div>
      );
    });
    return (
      <div className={styles['input-preview']}>
        { this.props.isLoading ?
          <LoadingOverlay text="Sampling Documents..." /> :
          null
        }
        <div className={styles['input-preview-documents']}>
          {documents}
        </div>
      </div>
    );
  }
}

export default InputPreview;
