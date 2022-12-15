import React, { useMemo, useState } from 'react';
import {
  Subtitle,
  Icon,
  css,
  cx,
  palette,
  spacing,
  KeylineCard,
} from '@mongodb-js/compass-components';
import find from 'lodash.find';
import { withPreferences } from 'compass-preferences-model';
import type AppRegistry from 'hadron-app-registry';

import Type from './type';
import Minichart from './minichart';
import detectCoordinates from '../modules/detect-coordinates';
import type configureActions from '../actions';

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
  paddingTop: spacing[3],
  marginBottom: spacing[2],
});

const fieldListContainerStyles = css({
  position: 'relative',
});

const fieldTypeListStyles = css({
  paddingTop: spacing[1],
});

const fieldNameContainerStyles = css({
  position: 'relative',
});

const fieldRowStyles = css({
  marginBottom: spacing[4],
  padding: `0px ${spacing[3]}px`,
  display: 'grid',

  gridTemplateAreas: '"description chart"',
  gridTemplateColumns: '1fr 2fr',
  columnGap: spacing[6],
  position: 'relative',
  alignItems: 'center',
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

type FieldType = {
  name: string;
  path: string;
  probability: number;
  values?: unknown[];
  fields: FieldType[];
  types: FieldType[];
};

type FieldProps = {
  actions: ReturnType<typeof configureActions>;
  localAppRegistry: AppRegistry;
  name: string;
  path: string;
  types: FieldType[];
  enableMaps: boolean;
};

function sortTypes(types: FieldType[]) {
  // Sort the types in descending order and push undefined to the end.
  return (
    types?.sort((a: FieldType, b: FieldType) => {
      if (a.name === 'Undefined') {
        return 1;
      }
      if (b.name === 'Undefined') {
        return -1;
      }
      return b.probability - a.probability;
    }) || []
  );
}

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
function getNestedDocType(types: FieldType[]) {
  // Check for directly nested document first.
  const docType = find(types, { name: 'Document' });
  if (docType) {
    return docType;
  }
  // Otherwise check for nested documents inside an array.
  const arrType = find(types, { name: 'Array' });
  if (arrType) {
    return find(arrType.types, { name: 'Document' });
  }
  return null;
}

/**
 * Tests type for semantic interpretations, like geo coordinates, and
 * replaces type information like name and values if there's a match.
 */
function getSemanticType(type: FieldType, enableMaps: boolean) {
  // Check if the type represents geo coordinates, if privacy settings allow.
  if (!enableMaps) {
    return type;
  }
  const coords = detectCoordinates(type);
  if (coords) {
    return {
      ...type,
      name: 'Coordinates',
      values: coords,
    };
  }

  return type;
}

function Field({
  actions,
  localAppRegistry,
  name,
  path,
  types,
  enableMaps,
}: FieldProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Set the active type to the first type in the sorted props.types array.
  const [activeType, setActiveType] = useState(() => {
    const sortedTypes = sortTypes(types);
    return sortedTypes.length > 0 ? sortedTypes[0] : null;
  });

  const activeShownTypes = useMemo(() => sortTypes(types), [types]);
  const nestedDocType = useMemo(() => getNestedDocType(types), [types]);

  const fieldAccordionButtonId = `$$${path}.${name}-button`;
  const fieldListRegionId = `$$${path}.${name}-fields-region`;

  return (
    <KeylineCard className={fieldContainerStyles}>
      <div className={fieldStyles} data-testid="schema-field">
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
                  <Type
                    key={'type-' + semanticType.name}
                    activeType={activeType}
                    onRenderType={(type: FieldType) => setActiveType(type)}
                    self={semanticType}
                    showSubTypes
                    {...semanticType}
                  />
                );
              })}
            </div>
          </div>
          <div className={fieldChartContainerStyles}>
            <Minichart
              fieldName={path}
              type={activeType}
              nestedDocType={nestedDocType}
              actions={actions}
              localAppRegistry={localAppRegistry}
            />
          </div>
        </div>

        {/* Render nested fields when it's a nested array / document. */}
        {isExpanded && (
          <div
            className={cx('schema-field-list', fieldListContainerStyles)}
            data-testid="schema-field-list"
            id={fieldListRegionId}
            role="region"
            aria-labelledby={fieldAccordionButtonId}
          >
            {(getNestedDocType(types)?.fields || []).map((field: FieldType) => (
              <div className={nestedFieldStyles} key={field.name}>
                <Field
                  actions={actions}
                  localAppRegistry={localAppRegistry}
                  enableMaps={enableMaps}
                  {...field}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </KeylineCard>
  );
}

export default withPreferences(Field, ['enableMaps'], React);
