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
  Tooltip,
  useDarkMode,
} from '@mongodb-js/compass-components';
import React, { useState, useCallback } from 'react';
import {
  errorEncountered,
  fetchCoveredQueries,
  type Field,
} from '../../modules/create-index';
import MDBCodeViewer from './mdb-code-viewer';
import { areAllFieldsFilledIn } from '../../utils/create-index-modal-validation';
import { connect } from 'react-redux';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import type { RootState } from '../../modules';

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

const indexFieldsCalloutDarkStyles = css({
  border: `1px solid ${palette.gray.base}`,
});

const codeEquivalentToggleLabelStyles = css({
  marginRight: spacing[100],
  fontWeight: 'normal',
});

const coveredQueriesHeaderContainerStyles = css({
  marginBottom: spacing[200],
});

const coveredQueriesCalloutStyles = css({
  borderRadius: '12px',
  padding: spacing[600],
  marginBottom: spacing[600],
});

const lightModeCoveredQueriesCalloutStyles = css({
  border: `1px solid ${palette.gray.light2}`,
  background: palette.gray.light3,
});

const darkModeCoveredQueriesCalloutStyles = css({
  border: `1px solid ${palette.gray.dark2}`,
  background: palette.black,
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

const coveredQueriesLinkStyles = css({
  marginTop: spacing[200],
});

const optimalQueriesStyles = css({
  marginTop: spacing[400],
});

export type IndexFlowSectionProps = {
  fields: Field[];
  createIndexFieldsComponent: JSX.Element | null;
  dbName: string;
  collectionName: string;
  onErrorEncountered: (error: string) => void;
  onCoveredQueriesFetched: () => void;
  coveredQueriesArr: Array<Record<string, number>> | null;
  hasIndexFieldChanges: boolean;
};

export const generateCoveredQueries = (
  coveredQueriesArr: Array<Record<string, number>> | null,
  track: TrackFunction
) => {
  if (!coveredQueriesArr) {
    return;
  }
  const rows = [];
  for (let i = 0; i < coveredQueriesArr.length; i++) {
    const currentRow = Object.assign({}, ...coveredQueriesArr.slice(0, i + 1));
    rows.push(
      <>
        {JSON.stringify(currentRow)} <br />
      </>
    );
  }

  if (rows.length === 0) {
    // TODO: remove this in CLOUDP-320224
    track('Error generating covered queries', {
      context: 'Create Index Modal',
    });
    throw new Error(
      'Error generating covered query examples. Please try again later.'
    );
  }
  return <>{rows}</>;
};

export const generateOptimalQueries = (
  coveredQueriesArr: Array<Record<string, number>> | null
) => {
  if (!coveredQueriesArr) {
    return;
  }
  const numOfFields = coveredQueriesArr.length;

  // Do not show for 1 field or less
  if (numOfFields < 2) {
    return '';
  }

  const lastField = coveredQueriesArr[numOfFields - 1];
  const lastFieldKey = Object.keys(lastField)[0];

  // If there are only two fields, we want to show two examples
  // i.e. {a:1, b: {$gt:2}} and {a:1}.sort({b: 1})
  if (numOfFields === 2) {
    const firstField = coveredQueriesArr[0];
    const firstFieldKey = Object.keys(firstField)[0];

    return (
      <>
        {`{"${firstFieldKey}":1,"${lastFieldKey}":{"$gt":2}}`}
        <br />
        {`{"${firstFieldKey}":1}.sort({"${lastFieldKey}":1})`}
      </>
    );
  }

  // If there are more than two fields, we want to show a longer optimal query with gt and sort
  // i.e. {a:1, b:2, d:{gt:3}}.sort({c:1})

  const secondToLastField = coveredQueriesArr[numOfFields - 2];
  const secondToLastFieldKey = Object.keys(secondToLastField)[0];

  const optimalQueries = coveredQueriesArr
    .slice(0, -2)
    .reduce<Record<string, unknown>>((acc, obj) => {
      const key = Object.keys(obj)[0];
      const value = obj[key];

      acc[key] = value;

      return acc;
    }, {});

  // Put last field in range and second to last field in sort
  optimalQueries[lastFieldKey] = { $gt: coveredQueriesArr.length - 1 };
  return (
    JSON.stringify(optimalQueries) + `.sort({"${secondToLastFieldKey}": 1})`
  );
};

export const generateCoveredQueriesArr = (fields: Field[]) => {
  return fields.map((field, index) => {
    return { [field.name]: index + 1 };
  });
};

const IndexFlowSection = ({
  createIndexFieldsComponent,
  fields,
  dbName,
  collectionName,
  onErrorEncountered,
  onCoveredQueriesFetched,
  coveredQueriesArr,
  hasIndexFieldChanges,
}: IndexFlowSectionProps) => {
  const darkMode = useDarkMode();
  const [isCodeEquivalentToggleChecked, setIsCodeEquivalentToggleChecked] =
    useState(false);

  const hasUnsupportedQueryTypes = fields.some((field) => {
    return field.type === '2dsphere' || field.type === 'text';
  });
  const track = useTelemetry();

  const isCoveredQueriesButtonDisabled =
    !areAllFieldsFilledIn(fields) ||
    hasUnsupportedQueryTypes ||
    !hasIndexFieldChanges;

  const indexNameTypeMap = fields.reduce<Record<string, string>>(
    (accumulator, currentValue) => {
      if (currentValue.name && currentValue.type) {
        accumulator[currentValue.name] = currentValue.type;
      }
      return accumulator;
    },
    {}
  );

  const onCoveredQueriesButtonClick = useCallback(() => {
    track('Covered Queries Button Clicked', {
      context: 'Create Index Modal',
    });

    try {
      onCoveredQueriesFetched();
    } catch (e) {
      onErrorEncountered(e instanceof Error ? e.message : String(e));
    }
  }, [onCoveredQueriesFetched, onErrorEncountered, track]);

  const coveredQueries = generateCoveredQueries(coveredQueriesArr, track);
  const optimalQueries = generateOptimalQueries(coveredQueriesArr);
  const showCoveredQueries = coveredQueriesArr !== null;

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
            onChange={(value) => {
              setIsCodeEquivalentToggleChecked(value);
              track('Code Equivalent Toggled', {
                context: 'Create Index Modal',
                toggled: value === true ? 'On' : 'Off',
              });
            }}
            checked={isCodeEquivalentToggleChecked}
            disabled={!areAllFieldsFilledIn(fields)}
          />
        </div>
      </div>
      <div
        className={cx(
          indexFieldsCalloutStyles,
          darkMode && indexFieldsCalloutDarkStyles
        )}
      >
        {isCodeEquivalentToggleChecked ? (
          <MDBCodeViewer
            dbName={dbName}
            collectionName={collectionName}
            indexNameTypeMap={indexNameTypeMap}
            onCopy={() => {
              track('Input Index Copied', {
                context: 'Create Index Modal',
              });
            }}
          />
        ) : (
          createIndexFieldsComponent
        )}

        <div className={buttonContainerStyles}>
          <Tooltip
            trigger={
              <Button
                data-testid="index-flow-section-covered-queries-button"
                className={coveredQueriesButtonStyles}
                onClick={onCoveredQueriesButtonClick}
                size="small"
                disabled={isCoveredQueriesButtonDisabled}
              >
                Show covered queries
              </Button>
            }
            align="top"
            justify="middle"
            enabled={hasUnsupportedQueryTypes}
          >
            Example queries are unavailable for 2dsphere and text
          </Tooltip>
        </div>
      </div>
      {showCoveredQueries && (
        <>
          <div
            className={cx(
              coveredQueriesHeaderContainerStyles,
              flexContainerStyles
            )}
          >
            <Body
              baseFontSize={16}
              weight="medium"
              className={coveredQueriesHeaderStyles}
            >
              Covered Queries
            </Body>

            <InfoSprinkle align="top" justify="middle">
              A covered query is a query that can be satisfied entirely using an
              index and does not have to examine any documents. If a query is
              covered, it is highly performant.
            </InfoSprinkle>
          </div>

          <div
            className={cx(
              coveredQueriesCalloutStyles,
              darkMode
                ? darkModeCoveredQueriesCalloutStyles
                : lightModeCoveredQueriesCalloutStyles
            )}
          >
            {/* Covered Queries */}

            <div>
              <Body
                className={codeStyles}
                data-testid="index-flow-section-covered-queries-examples"
              >
                {coveredQueries}
              </Body>
              <div className={coveredQueriesLinkStyles}>
                <Link
                  href="https://www.mongodb.com/docs/manual/core/query-optimization/"
                  onClick={() => {
                    track('Covered Queries Learn More Clicked', {
                      context: 'Create Index Modal',
                    });
                  }}
                >
                  Learn about covered queries
                </Link>
              </div>
            </div>

            {!!optimalQueries && (
              <div className={optimalQueriesStyles}>
                <span className={underlineStyles}>
                  Follow the Equality, Sort, Range (ESR) Rule. This index is
                  great for queries that have this pattern:
                </span>
                {/* Optimal queries */}
                <Body
                  className={codeStyles}
                  data-testid="index-flow-section-optimal-queries-examples"
                >
                  {optimalQueries}
                </Body>
                <div className={coveredQueriesLinkStyles}>
                  <Link
                    href="https://www.mongodb.com/docs/manual/tutorial/equality-sort-range-guideline/"
                    onClick={() => {
                      track('ESR Learn More Clicked', {
                        context: 'Create Index Modal',
                      });
                    }}
                  >
                    Learn about ESR
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const mapState = ({ createIndex }: RootState) => {
  const { coveredQueriesArr, hasIndexFieldChanges } = createIndex;
  return {
    coveredQueriesArr,
    hasIndexFieldChanges,
  };
};

const mapDispatch = {
  onErrorEncountered: errorEncountered,
  onCoveredQueriesFetched: fetchCoveredQueries,
};

export default connect(mapState, mapDispatch)(IndexFlowSection);
