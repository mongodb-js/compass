import React from 'react';
import {
  css,
  spacing,
  uiColors,
  H3,
  Subtitle,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  gap: spacing[3],
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
});

const headingStyles = css({
  color: uiColors.green.dark2,
  fontWeight: 'normal',
});

const bodyStyles = css({
  fontWeight: 'normal',
});

export const PipelineEmptyResults: React.FunctionComponent = () => {
  return (
    <div className={containerStyles} data-testid="pipeline-empty-results">
      <svg
        className="document-list-zero-state-graphic"
        xmlns="http://www.w3.org/2000/svg"
        width="38"
        height="48"
        viewBox="0 0 38 48"
      >
        <g
          fill="none"
          fillRule="evenodd"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          transform="translate(1 1)"
        >
          <polyline stroke="#00684a" points="30 .002 30 6.002 36 6.002" />
          <polyline stroke="#00684a" points="30 26.002 30 32.002 36 32.002" />
          <line y1=".002" y2="2.002" stroke="#00684a" />
          <line y1="12.002" y2="14.002" stroke="#00684a" />
          <polyline stroke="#00684a" points="0 6.002 0 8.002 2 8.002" />
          <line y1="18.002" y2="20.002" stroke="#00684a" />
          <line y1="24.002" y2="26.002" stroke="#00684a" />
          <line y1="30.002" y2="32.002" stroke="#00684a" />
          <polyline stroke="#00684a" points="0 36.002 0 38.002 2 38.002" />
          <line x1="6" x2="8" y1="8.002" y2="8.002" stroke="#00684a" />
          <line x1="12" x2="14" y1="8.002" y2="8.002" stroke="#00684a" />
          <line x1="18" x2="20" y1="8.002" y2="8.002" stroke="#00684a" />
          <line x1="6" x2="8" y1="38.002" y2="38.002" stroke="#00684a" />
          <line x1="12" x2="14" y1="38.002" y2="38.002" stroke="#00684a" />
          <line x1="18" x2="20" y1="38.002" y2="38.002" stroke="#00684a" />
          <polygon
            stroke="#00ed64"
            points="36 20.002 20 20.002 20 .002 30 .002 36 6.002"
          />
          <polygon
            stroke="#00ed64"
            points="36 46.002 20 46.002 20 26.002 30 26.002 36 32.002"
          />
        </g>
      </svg>
      <H3 className={headingStyles}>No results</H3>
      <Subtitle className={bodyStyles}>
        Try to modify your pipeline to get results
      </Subtitle>
    </div>
  );
};

export default PipelineEmptyResults;
