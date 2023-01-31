import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Icon,
  Body,
  css,
  cx,
  spacing,
  palette,
  InlineDefinition,
  Subtitle,
} from '@mongodb-js/compass-components';
import { SAMPLE_SIZE } from '../../modules/sample-documents';
import {
  InvalidDocumentPreview,
  ValidDocumentPreview,
} from '../document-preview';

const SAMPLE_DEFINITION = `A sample is fetched from a sample-space of ${SAMPLE_SIZE} randomly selected documents`;

/**
 * The Sample Documents editor component.
 */

const sampleDocumentsSectionStyles = css({
  marginTop: spacing[4],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
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
    renderValidDocument: PropTypes.func,
    renderInvalidDocument: PropTypes.func,
  }

  /**
   * Instead of directly rendering these preview components
   * we inject them via props so this and other parent components
   * can easily be tested without worrying about the underlying
   * connected components by simply stubbing these props.
   */
  static defaultProps = {
    renderValidDocument: () => <ValidDocumentPreview />,
    renderInvalidDocument: () => <InvalidDocumentPreview />
  }

  /**
   * Render matching documents.
   *
   * @returns {React.Component} The component.
   */
  renderMatchingDocuments() {
    return (
      <div className={sampleDocumentStyles} data-testid="matching-documents">
        <div className={cx(documentHeadingStyles, matchingStyles)}>
          <Icon glyph="CheckmarkWithCircle" size="small" />
          <Body className={documentHeadingTextStyles}>Passed validation</Body>
        </div>
        { this.props.renderValidDocument() }
      </div>
    );
  }

  /**
   * Render not matching documents.
   *
   * @returns {React.Component} The component.
   */
  renderNotMatchingDocuments() {
    return (
      <div className={sampleDocumentStyles} data-testid="notmatching-documents">
        <div className={cx(documentHeadingStyles, notMatchingStyles)}>
          <Icon glyph="XWithCircle" size="small" />
          <Body className={documentHeadingTextStyles}>Failed validation</Body>
        </div>
        { this.props.renderInvalidDocument() }
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
        <Subtitle>
          <InlineDefinition definition={SAMPLE_DEFINITION}>
            Sample documents
          </InlineDefinition>
        </Subtitle>
        <div className={sampleDocumentsStyles}>
          {this.renderMatchingDocuments()}
          {this.renderNotMatchingDocuments()}
        </div>
      </div>
    );
  }
}

export default SampleDocuments;
