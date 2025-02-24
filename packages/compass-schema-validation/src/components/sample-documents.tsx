import React from 'react';
import {
  Icon,
  Body,
  css,
  cx,
  spacing,
  palette,
  InlineDefinition,
  Subtitle,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { SAMPLE_SIZE } from '../modules/sample-documents';
import {
  InvalidDocumentPreview,
  ValidDocumentPreview,
} from './document-preview';

const SAMPLE_DEFINITION = `A sample is fetched from a sample-space of ${SAMPLE_SIZE} randomly selected documents`;

/**
 * The Sample Documents editor component.
 **/
const sampleDocumentsSectionStyles = css({
  marginTop: spacing[600],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

const sampleDocumentsStyles = css({
  display: 'flex',
  gap: spacing[400],
});

const sampleDocumentStyles = css({
  overflow: 'auto',
  flex: '50%',
});

const documentHeadingStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  marginBottom: spacing[400],
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

export function SampleDocuments() {
  const darkMode = useDarkMode();
  return (
    <div className={sampleDocumentsSectionStyles}>
      <Subtitle>
        <InlineDefinition definition={SAMPLE_DEFINITION}>
          Sample documents
        </InlineDefinition>
      </Subtitle>
      <div className={sampleDocumentsStyles}>
        {/* Documents that match the validation */}
        <div className={sampleDocumentStyles} data-testid="matching-documents">
          <div
            className={cx(
              documentHeadingStyles,
              darkMode ? matchingStylesDark : matchingStylesLight
            )}
          >
            <Icon glyph="CheckmarkWithCircle" size="small" />
            <Body className={documentHeadingTextStyles}>Passed validation</Body>
          </div>
          <ValidDocumentPreview />
        </div>

        {/* Documents that do not match the validation */}
        <div
          className={sampleDocumentStyles}
          data-testid="notmatching-documents"
        >
          <div
            className={cx(
              documentHeadingStyles,
              darkMode ? notMatchingStylesDark : notMatchingStylesLight
            )}
          >
            <Icon glyph="XWithCircle" size="small" />
            <Body className={documentHeadingTextStyles}>Failed validation</Body>
          </div>
          <InvalidDocumentPreview />
        </div>
      </div>
    </div>
  );
}
