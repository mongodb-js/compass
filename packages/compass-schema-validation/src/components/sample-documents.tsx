import React, { useMemo } from 'react';
import {
  Icon,
  Body,
  css,
  cx,
  spacing,
  palette,
  InlineDefinition,
  useDarkMode,
  Button,
  ButtonVariant,
} from '@mongodb-js/compass-components';
import { fetchSampleDocuments, SAMPLE_SIZE } from '../modules/sample-documents';
import { DocumentPreview } from './document-preview';
import { connect } from 'react-redux';
import type { RootState } from '../modules';

const SAMPLE_DEFINITION = `A sample is fetched from a sample-space of ${SAMPLE_SIZE} randomly selected documents`;

/**
 * The Sample Documents editor component.
 **/
const sampleDocumentsSectionStyles = css({
  marginTop: spacing[600],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: spacing[200],
  padding: spacing[400],
});

const sampleDocumentsSectionDarkModeStyles = css({
  border: `1px solid ${palette.gray.dark2}`,
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

const initialStateContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '228px', // using the same space as the previews
  gap: spacing[300],
});

const previewHeaderStyles = css({
  fontSize: spacing[400],
  fontWeight: 'bold',
  color: palette.green.dark2,
  marginTop: spacing[200],
});

const previewHeaderDarkModeStyles = css({
  color: palette.green.light2,
});

const DocumentGraphic: React.FunctionComponent = () => {
  const darkMode = useDarkMode();
  const fillColor = useMemo(
    () => (darkMode ? palette.green.light1 : palette.green.base),
    [darkMode]
  );
  const strokeColor = useMemo(
    () => (darkMode ? palette.white : palette.black),
    [darkMode]
  );

  return (
    <svg
      width="64"
      height="58"
      viewBox="0 0 64 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0.5" y="1" width="63" height="56" rx="2" stroke={strokeColor} />
      <line y1="28.5" x2="64" y2="28.5" stroke={strokeColor} />
      <line
        x1="8.61035"
        y1="15.5898"
        x2="32.9054"
        y2="15.5898"
        stroke={strokeColor}
      />
      <circle
        cx="44.9268"
        cy="16.0898"
        r="2"
        fill={fillColor}
        stroke={strokeColor}
      />
      <circle
        cx="52.8896"
        cy="16.0898"
        r="2"
        fill={fillColor}
        stroke={strokeColor}
      />
    </svg>
  );
};

const InitialState: React.FC<{
  onPreviewClick: () => void;
}> = ({ onPreviewClick }) => {
  const darkMode = useDarkMode();
  return (
    <div className={initialStateContainerStyles}>
      <DocumentGraphic />
      <div
        className={cx(
          previewHeaderStyles,
          darkMode && previewHeaderDarkModeStyles
        )}
      >
        <InlineDefinition definition={SAMPLE_DEFINITION}>
          Preview sample documents
        </InlineDefinition>
      </div>
      <div>
        This section displays one document that passed validation and one that
        failed validation.
      </div>
      <Button
        onClick={onPreviewClick}
        variant={ButtonVariant.PrimaryOutline}
        data-testid="load-sample-documents"
      >
        Preview documents
      </Button>
    </div>
  );
};

function SampleDocuments({
  validDocument,
  invalidDocument,
  isInitialState,
  fetchSampleDocuments,
}: {
  validDocument?: Record<string, unknown>;
  invalidDocument?: Record<string, unknown>;
  isInitialState: boolean;
  fetchSampleDocuments: () => void;
}) {
  const darkMode = useDarkMode();

  return (
    <div
      className={cx(
        sampleDocumentsSectionStyles,
        darkMode && sampleDocumentsSectionDarkModeStyles
      )}
    >
      {isInitialState ? (
        <InitialState onPreviewClick={fetchSampleDocuments} />
      ) : (
        <div className={sampleDocumentsStyles}>
          {/* Documents that match the validation */}
          <div
            className={sampleDocumentStyles}
            data-testid="matching-documents"
          >
            <div
              className={cx(
                documentHeadingStyles,
                darkMode ? matchingStylesDark : matchingStylesLight
              )}
            >
              <Icon glyph="CheckmarkWithCircle" size="small" />
              <Body className={documentHeadingTextStyles}>
                Passed validation
              </Body>
            </div>
            <DocumentPreview document={validDocument} />
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
              <Body className={documentHeadingTextStyles}>
                Failed validation
              </Body>
            </div>
            <DocumentPreview document={invalidDocument} />
          </div>
        </div>
      )}
    </div>
  );
}

const ConnectedSampleDocuments = connect(
  (state: RootState) => ({
    validDocument: state.sampleDocuments.validDocument,
    invalidDocument: state.sampleDocuments.invalidDocument,
    isInitialState: state.sampleDocuments.validDocumentState === 'initial',
  }),
  {
    fetchSampleDocuments,
  }
)(SampleDocuments);

export { ConnectedSampleDocuments as SampleDocuments };
