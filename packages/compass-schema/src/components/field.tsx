import React, { useEffect, useMemo, useState } from 'react';
import {
  Subtitle,
  Icon,
  css,
  cx,
  palette,
  spacing,
  KeylineCard,
  SignalPopover,
  PerformanceSignals,
} from '@mongodb-js/compass-components';
import { debounce, find } from 'lodash';
import { withPreferences } from 'compass-preferences-model/provider';
import type {
  ArraySchemaType,
  DocumentSchemaType,
  SchemaField,
  SchemaType,
} from 'mongodb-schema';
import { FieldType, sortTypes } from './type';
import Minichart from './minichart';
import detectCoordinates from '../modules/detect-coordinates';
import { useQueryBarQuery } from '@mongodb-js/compass-query-bar';
import { useChangeQueryBarQuery } from '@mongodb-js/compass-query-bar';

const toggleCollapseButtonIconStyles = css({
  color: palette.gray.dark2,
});

const fieldNameStyles = css({
  fontWeight: 'bold',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const expandCollapseFieldButtonStyles = css({
  display: 'flex',
  marginLeft: -spacing[3],
  alignItems: 'center',
  border: 'none',
  background: 'none',
  borderRadius: '6px',
  boxShadow: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  transition: 'box-shadow 150ms ease-in-out',
  '&:hover': {
    cursor: 'pointer',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 3px ${palette.blue.light1}`,
  },
});

const fieldContainerStyles = css({
  marginBottom: spacing[2],
});

const fieldStyles = css({
  overflow: 'hidden',
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
});

const fieldExpandedStyles = css({
  paddingBottom: 0,
});

const fieldListContainerStyles = css({
  marginTop: spacing[3],
  position: 'relative',
});

const fieldTypeListStyles = css({
  paddingTop: spacing[1],
});

const fieldNameContainerStyles = css({
  display: 'flex',
  paddingTop: spacing[2],
  alignItems: 'center',
  gap: spacing[2],
});

const fieldRowStyles = css({
  padding: `0px ${spacing[3]}px`,
  display: 'grid',

  gridTemplateAreas: '"description chart"',
  gridTemplateColumns: '1fr 2fr',
  columnGap: spacing[6],
  position: 'relative',
});

const fieldDescriptionStyles = css({
  gridArea: 'description',
});

const fieldChartContainerStyles = css({
  gridArea: 'chart',
});

const nestedFieldStyles = css({
  margin: spacing[2],
});

type FieldProps = {
  name: string;
  path: string[];
  types: SchemaType[];
  enableMaps: boolean;
};

/**
 * Returns Document type object of a nested document, either directly nested
 * or sub-documents inside an array.
 *
 * @example
 * {foo: {bar: 1}} ==> {bar: 1} is a direct descendant
 * {foo: [{baz: 2}]} ==> {baz: 2} is a nested document inside an array
 *
 * @see mongodb-js/mongodb-schema
 */
function getNestedDocType(
  types: SchemaType[]
): null | undefined | DocumentSchemaType {
  // Check for directly nested document first.
  const docType = find(types, { name: 'Document' });
  if (docType) {
    return docType as DocumentSchemaType;
  }
  // Otherwise check for nested documents inside an array.
  const arrType = find(types, { name: 'Array' });
  if (arrType) {
    return find((arrType as ArraySchemaType).types, { name: 'Document' }) as
      | DocumentSchemaType
      | undefined;
  }
  return null;
}

/**
 * Tests type for semantic interpretations, like geo coordinates, and
 * replaces type information like name and values if there's a match.
 */
function getSemanticType(
  type: SchemaType,
  enableMaps: boolean
): SchemaType & {
  values?: any[];
  types?: SchemaType[];
} {
  // Check if the type represents geo coordinates, if privacy settings allow.
  if (!enableMaps) {
    return type;
  }
  const coords = detectCoordinates(type);
  if (coords && typeof coords !== 'boolean') {
    return {
      ...type,
      name: 'Coordinates',
      values: coords,
    };
  }

  return type;
}

function isArraySchemaType(type: SchemaType): type is ArraySchemaType {
  return type.name === 'Array';
}

export function shouldShowUnboundArrayInsight(
  schemaType: SchemaType | SchemaType[],
  thresholdLength = 250
): boolean {
  if (Array.isArray(schemaType)) {
    return schemaType.some((type) => {
      return shouldShowUnboundArrayInsight(type, thresholdLength);
    });
  }
  return (
    isArraySchemaType(schemaType) &&
    schemaType.averageLength >= thresholdLength &&
    schemaType.types.some((type) => {
      return ['Object', 'Document', 'ObjectId', 'String'].includes(
        type.bsonType
      );
    })
  );
}

function Field({ name, path, types, enableMaps }: FieldProps) {
  const query = useQueryBarQuery();
  const changeQuery = useChangeQueryBarQuery();
  const [isExpanded, setIsExpanded] = useState(false);
  // Set the active type to the first type in the sorted props.types array.
  const [activeType, setActiveType] = useState(() => {
    const sortedTypes = sortTypes(types);
    return sortedTypes.length > 0
      ? getSemanticType(sortedTypes[0], enableMaps)
      : undefined;
  });

  // In some cases charts can call the change callback too often (for examlpe
  // when selecting from a very tightly rendered list of timeline items, like
  // ObjectIds), to avoid application hanging trying to process them all
  // syncronously and sequentially causing non-stop re-renders, we're debouncing
  // change call a bit and only applying the last selected change to the actual
  // query bar
  const debouncedChangeQuery = useMemo(() => {
    return debounce(changeQuery, 100);
  }, [changeQuery]);

  useEffect(() => {
    return () => {
      debouncedChangeQuery.cancel();
    };
  }, [debouncedChangeQuery]);

  const activeShownTypes = useMemo(() => sortTypes(types), [types]);
  const nestedDocType = useMemo(() => getNestedDocType(types), [types]);

  const fieldAccordionButtonId = `${JSON.stringify(path)}.${name}-button`;
  const fieldListRegionId = `${JSON.stringify(path)}.${name}-fields-region`;

  // TODO(COMPASS-7547): Convert the string array of paths to a single string
  // with dots between field names. This will cause collisions when there are
  // fields with dots in them.
  const fieldName = path.join('.');

  return (
    <KeylineCard className={fieldContainerStyles}>
      <div
        className={cx(fieldStyles, isExpanded && fieldExpandedStyles)}
        data-testid="schema-field"
      >
        <div className={fieldRowStyles}>
          <div className={fieldDescriptionStyles}>
            <div
              className={fieldNameContainerStyles}
              data-testid="schema-field-name"
            >
              {nestedDocType ? (
                <button
                  className={expandCollapseFieldButtonStyles}
                  id={fieldAccordionButtonId}
                  type="button"
                  aria-label={
                    isExpanded
                      ? 'Collapse Document Schema'
                      : 'Expand Document Schema'
                  }
                  aria-expanded={isExpanded}
                  aria-controls={fieldListRegionId}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Icon
                    className={toggleCollapseButtonIconStyles}
                    glyph={isExpanded ? 'CaretDown' : 'CaretRight'}
                  />
                  &nbsp;
                  <Subtitle className={fieldNameStyles}>{name}</Subtitle>
                </button>
              ) : (
                <Subtitle className={fieldNameStyles}>{name}</Subtitle>
              )}
              {shouldShowUnboundArrayInsight(types) && (
                <SignalPopover
                  signals={PerformanceSignals.get('unbound-array')}
                ></SignalPopover>
              )}
            </div>
            <div
              className={cx('schema-field-type-list', fieldTypeListStyles)}
              data-testid="schema-field-type-list"
            >
              {/* Render types represented as horizontal bars with labels. */}
              {activeShownTypes.map((type) => {
                // Allow for semantic types and convert the type, e.g. geo coordinates.
                const semanticType = getSemanticType(type, enableMaps);
                return (
                  <FieldType
                    key={`type-${semanticType.name}`}
                    activeType={activeType}
                    onSetTypeActive={(type: SchemaType) =>
                      setActiveType(getSemanticType(type, enableMaps))
                    }
                    type={semanticType}
                    types={semanticType.types}
                    showSubTypes
                    probability={semanticType.probability}
                    typeName={semanticType.name}
                  />
                );
              })}
            </div>
          </div>
          <div className={fieldChartContainerStyles}>
            <Minichart
              fieldName={fieldName}
              fieldValue={query.filter?.[fieldName]}
              type={activeType}
              nestedDocType={nestedDocType}
              onQueryChanged={debouncedChangeQuery}
            />
          </div>
        </div>

        {/* Render nested fields when it's a nested array / document. */}
        {isExpanded && (
          <div
            className={fieldListContainerStyles}
            data-testid="schema-field-list"
            id={fieldListRegionId}
            role="region"
            aria-labelledby={fieldAccordionButtonId}
          >
            {(getNestedDocType(types)?.fields || []).map(
              (field: SchemaField) => (
                <div className={nestedFieldStyles} key={field.name}>
                  <Field enableMaps={enableMaps} {...field} />
                </div>
              )
            )}
          </div>
        )}
      </div>
    </KeylineCard>
  );
}

export default withPreferences(Field, ['enableMaps']);
