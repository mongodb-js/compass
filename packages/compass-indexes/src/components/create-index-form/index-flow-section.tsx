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
} from '@mongodb-js/compass-components';
import React, { useState, useCallback, useEffect } from 'react';
import {
  errorCleared,
  errorEncountered,
  type Field,
} from '../../modules/create-index';
import MDBCodeViewer from './mdb-code-viewer';
import { areAllFieldsFilledIn } from '../../utils/create-index-modal-validation';
import { connect } from 'react-redux';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

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
  dbName: string;
  collectionName: string;
  onErrorEncountered: (error: string) => void;
  onErrorCleared: () => void;
};

const generateCoveredQueries = (
  coveredQueriesArr: Array<Record<string, number>>,
  track: TrackFunction
) => {
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

const generateOptimalQueries = (
  coveredQueriesArr: Array<Record<string, number>>
) => {
  const numOfFields = coveredQueriesArr.length;

  // Do not show for 1 field or less
  if (numOfFields < 2) {
    return '';
  }

  const lastField = coveredQueriesArr[numOfFields - 1];
  const lastFieldKey = Object.keys(lastField)[0];

  // If there are only two fields, we want to show two examples
  // i.e. {a:1, b: {$gt:2}} and {a:1}.sort({b: 2})
  if (numOfFields === 2) {
    const firstField = coveredQueriesArr[0];
    const firstFieldKey = Object.keys(firstField)[0];

    return (
      <>
        {`{"${firstFieldKey}":1,"${lastFieldKey}":{"$gt":2}}}`}
        <br />
        {`{"${firstFieldKey}":1}.sort({"${lastFieldKey}":2})`}
      </>
    );
  }

  // If there are more than two fields, we want to show a longer optimal query with gt and sort
  // i.e. {a:1, b:2, c:{gt:3}}.sort({d:1})
  const optimalQueries = coveredQueriesArr
    .slice(0, -1)
    .reduce<Record<string, unknown>>((acc, obj, index) => {
      const key = Object.keys(obj)[0];
      const value = obj[key];

      if (index === numOfFields - 2) {
        acc[key] = { $gt: value };
      } else {
        acc[key] = value;
      }

      return acc;
    }, {});

  return JSON.stringify(optimalQueries) + `.sort(${lastFieldKey}: 1})`;
};

const IndexFlowSection = ({
  createIndexFieldsComponent,
  fields,
  dbName,
  collectionName,
  onErrorEncountered,
  onErrorCleared,
}: IndexFlowSectionProps) => {
  const [isCodeEquivalentToggleChecked, setIsCodeEquivalentToggleChecked] =
    useState(false);
  const [hasFieldChanges, setHasFieldChanges] = useState(false);

  const hasUnsupportedQueryTypes = fields.some((field) => {
    return field.type === '2dsphere' || field.type === 'text';
  });
  const track = useTelemetry();

  const isCoveredQueriesButtonDisabled =
    !areAllFieldsFilledIn(fields) ||
    hasUnsupportedQueryTypes ||
    !hasFieldChanges;

  const indexNameTypeMap = fields.reduce<Record<string, string>>(
    (accumulator, currentValue) => {
      if (currentValue.name && currentValue.type) {
        accumulator[currentValue.name] = currentValue.type;
      }
      return accumulator;
    },
    {}
  );

  const [coveredQueriesObj, setCoveredQueriesObj] = useState<{
    coveredQueries: JSX.Element;
    optimalQueries: string | JSX.Element;
    showCoveredQueries: boolean;
  }>({
    coveredQueries: <></>,
    optimalQueries: '',
    showCoveredQueries: false,
  });

  const onCoveredQueriesButtonClick = useCallback(() => {
    const coveredQueriesArr = fields.map((field, index) => {
      return { [field.name]: index + 1 };
    });

    try {
      setCoveredQueriesObj({
        coveredQueries: generateCoveredQueries(coveredQueriesArr, track),
        optimalQueries: generateOptimalQueries(coveredQueriesArr),
        showCoveredQueries: true,
      });
    } catch (e) {
      onErrorEncountered(e instanceof Error ? e.message : String(e));
    }

    setHasFieldChanges(false);
  }, [fields, onErrorEncountered, track]);

  useEffect(() => {
    setHasFieldChanges(true);
    onErrorCleared();
  }, [fields, onErrorCleared]);

  const { coveredQueries, optimalQueries, showCoveredQueries } =
    coveredQueriesObj;

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
            dbName={dbName}
            collectionName={collectionName}
            indexNameTypeMap={indexNameTypeMap}
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

          <div className={coveredQueriesCalloutStyles}>
            {/* Covered Queries */}
            <Body
              className={codeStyles}
              data-testid="index-flow-section-covered-queries-examples"
            >
              {coveredQueries}
            </Body>

            {!!optimalQueries && (
              <>
                <p>
                  <span className={underlineStyles}>
                    Follow the Equality, Sort, Range (ESR) Rule. This index is
                    optimal for queries that have this pattern:
                  </span>
                  {/* Optimal queries */}
                  <Body
                    className={codeStyles}
                    data-testid="index-flow-section-optimal-queries-examples"
                  >
                    {optimalQueries}
                  </Body>
                </p>
                <Link href="https://www.mongodb.com/docs/manual/core/query-optimization/">
                  Learn More
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const mapState = () => {
  return {};
};

const mapDispatch = {
  onErrorEncountered: errorEncountered,
  onErrorCleared: errorCleared,
};

export default connect(mapState, mapDispatch)(IndexFlowSection);
