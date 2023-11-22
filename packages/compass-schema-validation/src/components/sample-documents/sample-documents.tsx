import React, { Component } from 'react';
import {
  Icon,
  Body,
  css,
  cx,
  spacing,
  palette,
  InlineDefinition,
  Subtitle,
  withDarkMode,
} from '@mongodb-js/compass-components';
import { SAMPLE_SIZE } from '../../modules/sample-documents';
import {
  InvalidDocumentPreview,
  ValidDocumentPreview,
} from '../document-preview';
import PropTypes from 'prop-types';

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

const matchingStylesLight = css({
  color: palette.green.dark2,
});

const notMatchingStylesLight = css({
  color: palette.red.dark2,
});

const matchingStylesDark = css({
  color: palette.green.dark1,
});

const notMatchingStylesDark = css({
  color: palette.red.light1,
});

const documentHeadingTextStyles = css({
  fontWeight: 'bold',
  color: 'inherit',
});

export interface SampleDocumentProps {
  darkMode?: boolean;
}
class SampleDocuments extends Component<SampleDocumentProps> {
  static displayName = 'SampleDocuments';

  static propTypes = {
    darkMode: PropTypes.bool,
  };

  /**
   * Render matching documents.
   */
  renderMatchingDocuments() {
    return (
      <div className={sampleDocumentStyles} data-testid="matching-documents">
        <div
          className={cx(
            documentHeadingStyles,
            this.props.darkMode ? matchingStylesDark : matchingStylesLight
          )}
        >
          <Icon glyph="CheckmarkWithCircle" size="small" />
          <Body className={documentHeadingTextStyles}>Passed validation</Body>
        </div>
        <ValidDocumentPreview />
      </div>
    );
  }

  /**
   * Render not matching documents.
   */
  renderNotMatchingDocuments() {
    return (
      <div className={sampleDocumentStyles} data-testid="notmatching-documents">
        <div
          className={cx(
            documentHeadingStyles,
            this.props.darkMode ? notMatchingStylesDark : notMatchingStylesLight
          )}
        >
          <Icon glyph="XWithCircle" size="small" />
          <Body className={documentHeadingTextStyles}>Failed validation</Body>
        </div>
        <InvalidDocumentPreview />
      </div>
    );
  }

  /**
   * Render ValidationEditor component.
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

export default withDarkMode<SampleDocumentProps>(SampleDocuments);
