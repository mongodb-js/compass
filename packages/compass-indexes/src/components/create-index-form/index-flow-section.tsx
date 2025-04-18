import {
  Body,
  Button,
  css,
  Icon,
  Link,
  palette,
  spacing,
  Toggle,
  Tooltip,
} from '@mongodb-js/compass-components';
import React from 'react';

const headerStyles = css({
  marginBottom: spacing[200],
});

const indexFieldsHeaderContainterStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const indexFieldsCalloutStyles = css({
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: '12px',
  padding: spacing[600],
  marginBottom: spacing[600],
});

const coveredQueriesHeaderContainterStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const coveredQueriesCalloutStyles = css({
  border: `1px solid ${palette.gray.light2}`,
  background: palette.gray.light3,
  borderRadius: '12px',
  padding: spacing[600],
  marginBottom: spacing[600],
});

const buttonContainerStyles = css({
  display: 'flex',
  justifyContent: 'right',
});

const coveredQueriesButtonStyles = css({
  height: spacing[600] + 4,
  float: 'right',
  marginTop: spacing[400],
});

const codeStyles = css({
  fontFamily: 'Source Code Pro',
});

const infoWithCircleIconStyles = css({
  color: palette.gray.dark1,
  marginLeft: spacing[200],
});

const IndexFlowSection = ({
  createIndexFieldsComponent,
}: {
  createIndexFieldsComponent: JSX.Element | null;
}) => {
  return (
    <div>
      <div className={indexFieldsHeaderContainterStyles}>
        <Body baseFontSize={16} weight="medium" className={headerStyles}>
          Input Index
        </Body>
        <Toggle
          size="xsmall"
          aria-label="Toggle Auto Preview"
          onChange={() => {
            () => {
              // TODO in CLOUDP-311784
            };
          }}
          checked={false}
        >
          Code Equivalent
        </Toggle>
      </div>
      <div className={indexFieldsCalloutStyles}>
        {createIndexFieldsComponent}

        <div className={buttonContainerStyles}>
          <Button
            className={coveredQueriesButtonStyles}
            onClick={() => {
              // TODO in CLOUDP-311782 generate covered queries
              // TODO in CLOUDP-311783 generate optimal queries
            }}
          >
            Show me covered queries
          </Button>
        </div>
      </div>

      <div className={coveredQueriesHeaderContainterStyles}>
        <Body baseFontSize={16} weight="medium" className={headerStyles}>
          Covered Queries
        </Body>
        <Tooltip
          enabled={true}
          trigger={
            <span>
              <Icon
                glyph="InfoWithCircle"
                className={infoWithCircleIconStyles}
              />
            </span>
          }
          triggerEvent="hover"
          align="top"
          justify="middle"
        >
          A covered query is a query that can be satisfied entirely using an
          index and does not have to examine any documents. If a query is
          covered, it is highly performant.
        </Tooltip>
      </div>

      <div className={coveredQueriesCalloutStyles}>
        {/* Covered Queries, clean up with actual covered queries examples in CLOUDP-311782 */}
        <Body baseFontSize={13} className={codeStyles}>
          {`{ awards.wins:3 }`} <br />
          {`{ awards.wins:3, imdb.rating:5 }`} <br />
          {`{ awards.wins:3, imdb.rating:5, awards.nominations:8 }`} <br />
        </Body>
        <p>
          <u>
            Follow the Equality, Sort, Range (ESR) Rule and this index is
            optimal for queries that have this pattern:
          </u>
          {/* Optimal queries, clean up with actual optimal queries in CLOUDP-311783 */}
          <Body baseFontSize={13} className={codeStyles}>
            {`{ awards.wins : 5, imdb.rating: {$gt : 5} }.sort({ awards.nominations : 1 }`}
          </Body>
        </p>

        <Link href="https://www.mongodb.com/docs/manual/core/query-optimization/">
          Learn More
        </Link>
      </div>
    </div>
  );
};

export default IndexFlowSection;
