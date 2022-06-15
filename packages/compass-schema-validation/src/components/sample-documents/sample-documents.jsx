import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CheckCircle from '../check-circle';
import CrossCircle from '../cross-circle';
import DocumentPreview from '../document-preview';
import LoadingOverlay from '../loading-overlay';

import styles from './sample-documents.module.less';

/**
 * The Sample Documents editor component.
 */
class SampleDocuments extends Component {
  static displayName = 'SampleDocuments';

  static propTypes = {
    sampleDocuments: PropTypes.shape({
      matching: PropTypes.object,
      notmatching: PropTypes.object,
      isLoading: PropTypes.bool
    })
  };

  /**
   * Should the component update?
   *
   * @param {Object} nextProps - The next properties.
   *
   * @returns {Boolean} If the component should update.
   */
  shouldComponentUpdate(nextProps) {
    return (
      nextProps.sampleDocuments.isLoading !== this.props.sampleDocuments.isLoading
    );
  }

  /**
   * Render matching documents.
   *
   * @returns {React.Component} The component.
   */
  renderMatchingDocuments() {
    const title = 'Sample Document That Passed Validation';

    return (
      <div className={styles['document-container']} data-test-id="matching-documents">
        <div className={styles['matching-documents']}>
          <CheckCircle />
          <span className={styles['matching-documents-title']}>
            {title}
          </span>
        </div>
        <DocumentPreview
          document={this.props.sampleDocuments.matching}
        />
      </div>
    );
  }

  /**
   * Render not matching documents.
   *
   * @returns {React.Component} The component.
   */
  renderNotMatchingDocuments() {
    const title = 'Sample Document That Failed Validation';

    return (
      <div className={styles['document-container']} data-test-id="notmatching-documents">
        <div className={styles['notmatching-documents']}>
          <CrossCircle />
          <span className={styles['matching-documents-title']}>
            {title}
          </span>
        </div>
        <DocumentPreview
          document={this.props.sampleDocuments.notmatching}
        />
      </div>
    );
  }

  /**
   * Render ValidationEditor component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={styles['sample-documents']}>
        <div className={styles['sample-documents-content']}>
          { this.props.sampleDocuments.isLoading ?
            <LoadingOverlay text="Sampling Document..." /> :
            null
          }
          {this.renderMatchingDocuments()}
          {this.renderNotMatchingDocuments()}
        </div>
      </div>
    );
  }
}

export default SampleDocuments;
