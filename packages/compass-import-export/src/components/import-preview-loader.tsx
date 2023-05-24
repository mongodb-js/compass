import React from 'react';

import { connect } from 'react-redux';

import {
  Button,
  css,
  cx,
  spacing,
  Body,
  palette,
  useDarkMode,
  SpinLoader,
} from '@mongodb-js/compass-components';
import type { RootImportState } from '../stores/import-store';
import { skipCSVAnalyze } from '../modules/import';

const loaderStyles = css({
  marginTop: spacing[3],
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[1],
  alignItems: 'center',
});

const explanationTextStyles = css({
  margin: `${spacing[3]}px 0`,
  width: '350px',
  textAlign: 'center',
});

const analyzeStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: `${spacing[4]}px 0`,
});

const analyzeStylesDark = css({
  backgroundColor: palette.gray.dark3,
});

const analyzeStylesLight = css({
  backgroundColor: palette.gray.light3,
});

export function ImportPreviewLoader({
  analyzeBytesTotal,
  analyzeBytesProcessed,
  skipCSVAnalyze,
}: {
  analyzeBytesTotal: number;
  analyzeBytesProcessed: number;
  skipCSVAnalyze: () => void;
}) {
  const darkMode = useDarkMode();

  return (
    <div
      className={cx(
        analyzeStyles,
        darkMode ? analyzeStylesDark : analyzeStylesLight
      )}
    >
      <Body weight="medium">Detecting field types</Body>
      {analyzeBytesTotal && (
        <div className={loaderStyles}>
          <SpinLoader />
          <Body>
            {Math.round((analyzeBytesProcessed / analyzeBytesTotal) * 100)}%
          </Body>
        </div>
      )}
      <Body className={explanationTextStyles}>
        We are scanning your CSV file row by row to detect the field types. You
        can skip this step and manually assign field types at any point during
        the process.
      </Body>
      <Button data-testid="skip-csv-analyze-button" onClick={skipCSVAnalyze}>
        Skip
      </Button>
    </div>
  );
}

/**
 * Map the state of the store to component properties.
 */
const mapStateToProps = (state: RootImportState) => ({
  analyzeBytesProcessed: state.import.analyzeBytesProcessed,
  analyzeBytesTotal: state.import.analyzeBytesTotal,
});

/**
 * Export the connected component as the default.
 */
export default connect(mapStateToProps, {
  skipCSVAnalyze,
})(ImportPreviewLoader);
