import {
  Body,
  Button,
  css,
  cx,
  Label,
  Link,
  palette,
  spacing,
  Toggle,
  fontFamilies,
  InfoSprinkle,
} from '@mongodb-js/compass-components';
import React, { useState } from 'react';
import type { Field } from '../../modules/create-index';
import MDBCodeViewer from './mdb-code-viewer';

const flexContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const indexFieldsHeaderContainerStyles = css({
  justifyContent: 'space-between',
  marginBottom: spacing[200],
});

const indexFieldsCalloutStyles = css({
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: '12px',
  padding: spacing[600],
  marginBottom: spacing[600],
});

const codeEquivalentToggleLabelStyles = css({
  marginRight: spacing[100],
  fontWeight: 'normal',
});

const coveredQueriesHeaderContainerStyles = css({
  marginBottom: spacing[200],
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
  float: 'right',
  marginTop: spacing[400],
});

const underlineStyles = css({
  textDecoration: 'underline',
});

const codeStyles = css({
  fontFamily: fontFamilies.code,
});

const coveredQueriesHeaderStyles = css({
  marginRight: spacing[200],
});

export type IndexFlowSectionProps = {
  fields: Field[];
  createIndexFieldsComponent: JSX.Element | null;
};

const IndexFlowSection = ({
  createIndexFieldsComponent,
  fields,
}: IndexFlowSectionProps) => {
  const [isCodeEquivalentToggleChecked, setIsCodeEquivalentToggleChecked] =
    useState(false);

  const areAllFieldsFilledIn = fields.every((field) => {
    return field.name && field.type;
  });

  const isCoveredQueriesButtonDisabled =
    !areAllFieldsFilledIn ||
    fields.some((field) => {
      return field.type === '2dsphere' || field.type === 'text';
    });

  const indexNameTypeMap = fields.reduce<Record<string, string>>(
    (accumulator, currentValue) => {
      if (currentValue.name && currentValue.type) {
        accumulator[currentValue.name] = currentValue.type;
      }
      return accumulator;
    },
    {}
  );

  return (
    <div>
      <div
        className={cx(indexFieldsHeaderContainerStyles, flexContainerStyles)}
      >
        <Body baseFontSize={16} weight="medium">
          Input Index
        </Body>
        <div className={flexContainerStyles}>
          <Label
            className={codeEquivalentToggleLabelStyles}
            htmlFor="code-equivalent-toggle"
          >
            Code Equivalent
          </Label>

          <Toggle
            size="xsmall"
            id="code-equivalent-toggle"
            aria-label="Toggle Code Equivalent"
            onChange={(value) => setIsCodeEquivalentToggleChecked(value)}
            checked={isCodeEquivalentToggleChecked}
            disabled={!areAllFieldsFilledIn}
          />
        </div>
      </div>
      <div className={indexFieldsCalloutStyles}>
        {isCodeEquivalentToggleChecked ? (
          <MDBCodeViewer
            dbName="hi"
            collectionName="bye"
            indexNameTypeMap={indexNameTypeMap}
          ></MDBCodeViewer>
        ) : (
          createIndexFieldsComponent
        )}

        <div className={buttonContainerStyles}>
          <Button
            className={coveredQueriesButtonStyles}
            onClick={() => {
              // TODO in CLOUDP-311782 generate covered queries
              // TODO in CLOUDP-311783 generate optimal queries
            }}
            size="small"
            disabled={isCoveredQueriesButtonDisabled}
          >
            Show me covered queries
          </Button>
        </div>
      </div>

      <div
        className={cx(coveredQueriesHeaderContainerStyles, flexContainerStyles)}
      >
        <Body
          baseFontSize={16}
          weight="medium"
          className={coveredQueriesHeaderStyles}
        >
          Covered Queries
        </Body>

        <InfoSprinkle align="top" justify="middle">
          {' '}
          A covered query is a query that can be satisfied entirely using an
          index and does not have to examine any documents. If a query is
          covered, it is highly performant.
        </InfoSprinkle>
      </div>

      <div className={coveredQueriesCalloutStyles}>
        {/* Covered Queries, clean up with actual covered queries examples in CLOUDP-311782 */}
        <Body
          className={codeStyles}
          data-testid="index-flow-section-covered-queries-examples"
        >
          {`{ awards.wins:3 }`} <br />
          {`{ awards.wins:3, imdb.rating:5 }`} <br />
          {`{ awards.wins:3, imdb.rating:5, awards.nominations:8 }`} <br />
        </Body>
        <p>
          <span className={underlineStyles}>
            Follow the Equality, Sort, Range (ESR) Rule and this index is
            optimal for queries that have this pattern:
          </span>
          {/* Optimal queries, clean up with actual optimal queries in CLOUDP-311783 */}
          <Body
            className={codeStyles}
            data-testid="index-flow-section-optimal-query-examples"
          >
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
