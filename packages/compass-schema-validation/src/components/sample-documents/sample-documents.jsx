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
  InlineDefinition,
} from '@mongodb-js/compass-components';
import { SAMPLE_SIZE } from '../../modules/sample-documents';

const SAMPLE_DEFINITION = [
  'A sample is fetched from a sample-space of',
  SAMPLE_SIZE,
  'randomly selected documents'
].join(' ');

/**
 * The Sample Documents editor component.
 */

const sampleDocumentsSectionStyles = css({
  marginTop: spacing[4],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2]
});

const sampleDocumentsHeaderStyles = css({
  fontSize: 16,
  fontWeight: 'bold'
});

const sampleDocumentsStyles = css({
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
      validDocument: PropTypes.object,
      validDocumentLoading: PropTypes.bool,
      invalidDocument: PropTypes.object,
      invalidDocumentLoading: PropTypes.bool,
    }),
    fetchValidDocument: PropTypes.func,
    fetchInvalidDocument: PropTypes.func
  };

  /**
   * Should the component update?
   *
   * @param {Object} nextProps - The next properties.
   *
   * @returns {Boolean} If the component should update.
   */
  shouldComponentUpdate(nextProps) {
    const { sampleDocuments: prevDocs } = this.props;
    const { sampleDocuments: nextDocs } = nextProps;
    return prevDocs.validDocumentLoading !== nextDocs.validDocumentLoading
      || prevDocs.invalidDocumentLoading !== nextDocs.invalidDocumentLoading
      || prevDocs.validDocument !== nextDocs.validDocument
      || prevDocs.invalidDocument !== nextDocs.invalidDocument;
  }

  /**
   * Render matching documents.
   *
   * @returns {React.Component} The component.
   */
  renderMatchingDocuments() {
    const {
      sampleDocuments: {
        validDocument,
        validDocumentLoading
      }
    } = this.props;

    return (
      <div className={sampleDocumentStyles} data-testid="matching-documents">
        <div className={cx(documentHeadingStyles, matchingStyles)}>
          <Icon glyph="CheckmarkWithCircle" size="small" />
          <Body className={documentHeadingTextStyles}>
            Passed validation
          </Body>
        </div>
        <DocumentPreview
          document={validDocument}
          isLoading={validDocumentLoading}
          loadSampleDocument={this.props.fetchValidDocument}
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
    const {
      sampleDocuments: {
        invalidDocument,
        invalidDocumentLoading
      }
    } = this.props;

    return (
      <div className={sampleDocumentStyles} data-testid="notmatching-documents">
        <div className={cx(documentHeadingStyles, notMatchingStyles)}>
          <Icon glyph="XWithCircle" size="small" />
          <Body className={documentHeadingTextStyles}>
            Failed validation
          </Body>
        </div>
        <DocumentPreview
          document={invalidDocument}
          isLoading={invalidDocumentLoading}
          loadSampleDocument={this.props.fetchInvalidDocument}
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
      <div className={sampleDocumentsSectionStyles}>
        <Body className={sampleDocumentsHeaderStyles}>
          <InlineDefinition definition={SAMPLE_DEFINITION}>
            Sample documents
          </InlineDefinition>
        </Body>
        <div className={sampleDocumentsStyles}>
          {this.renderMatchingDocuments()}
          {this.renderNotMatchingDocuments()}
        </div>
      </div>
    );
  }
}

export default SampleDocuments;
