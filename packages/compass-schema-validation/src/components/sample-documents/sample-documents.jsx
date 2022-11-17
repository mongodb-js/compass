import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DocumentPreview from '../document-preview';

import {
  Icon,
  Body,
  css,
  cx,
  spacing,
  palette,
} from '@mongodb-js/compass-components';

/**
 * The Sample Documents editor component.
 */

const sampleDocumentsStyles = css({
  marginTop: spacing[4],
  display: 'flex',
  gap: spacing[3],
});

const sampleDocumentStyles = css({
  flex: 1,
});

const documentHeadingStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1],
  marginBottom: spacing[3],
});

const matchingStyles = css({
  color: palette.green.dark2,
});

const notMatchingStyles = css({
  color: palette.red.dark2,
});

const documentHeadingTextStyles = css({
  fontWeight: 'bold',
  color: 'inherit',
});
class SampleDocuments extends Component {
  static displayName = 'SampleDocuments';

  static propTypes = {
    sampleDocuments: PropTypes.shape({
      matching: PropTypes.object,
      notmatching: PropTypes.object,
      isLoading: PropTypes.bool,
    }),
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
      nextProps.sampleDocuments.isLoading !==
      this.props.sampleDocuments.isLoading
    );
  }

  /**
   * Render matching documents.
   *
   * @returns {React.Component} The component.
   */
  renderMatchingDocuments() {
    const title = 'Sample document that passed validation';

    return (
      <div className={sampleDocumentStyles} data-testid="matching-documents">
        <div className={cx(documentHeadingStyles, matchingStyles)}>
          <Icon glyph="InfoWithCircle" size="small" />
          <Body className={documentHeadingTextStyles}>{title}</Body>
        </div>
        <DocumentPreview
          document={this.props.sampleDocuments.matching}
          isLoading={this.props.sampleDocuments.isLoading}
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
    const title = 'Sample document that failed falidation';

    return (
      <div className={sampleDocumentStyles} data-testid="notmatching-documents">
        <div className={cx(documentHeadingStyles, notMatchingStyles)}>
          <Icon glyph="XWithCircle" size="small" />
          <Body className={documentHeadingTextStyles}>{title}</Body>
        </div>
        <DocumentPreview
          document={this.props.sampleDocuments.notmatching}
          isLoading={this.props.sampleDocuments.isLoading}
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
      <div className={sampleDocumentsStyles}>
        {this.renderMatchingDocuments()}
        {this.renderNotMatchingDocuments()}
      </div>
    );
  }
}

export default SampleDocuments;
