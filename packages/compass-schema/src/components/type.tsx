import React, { useCallback, useMemo } from 'react';
import find from 'lodash.find';
import numeral from 'numeral';
import {
  Disclaimer,
  Tooltip,
  css,
  cx,
  palette,
  spacing,
} from '@mongodb-js/compass-components';

const schemaFieldTypeLabelStyles = css({
  textTransform: 'lowercase',
});

const typeContainerStyles = css({
  lineHeight: `${spacing[1]}px`,
  display: 'inline-block',
  verticalAlign: 'top',
});

const fieldButtonStyles = css({
  overflow: 'hidden',
  cursor: 'pointer',
  border: 'none',
  margin: 0,
  padding: 0,
  background: 'none',
  textAlign: 'left',
  width: '100%',
});

const fieldButtonUndefinedStyles = css({
  cursor: 'default',
});

const schemaFieldTypeBarStyles = css({
  height: '5px',
  marginRight: '2px',
  background: palette.gray.light1,
});

const schemaFieldTypeBarActiveStyles = css({
  background: palette.gray.dark2,
});

const schemaFieldTypeBarUndefinedStyles = css({
  background: palette.white,
  border: `1px solid ${palette.gray.light1}`,
});

export function sortTypes(types: SchemaFieldType[]) {
  // Sort the types in descending order and push undefined to the end.
  return (
    types?.sort((a: SchemaFieldType, b: SchemaFieldType) => {
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

// See https://github.com/mongodb-js/mongodb-schema for more information on
// the types returned by the schema analysis. Once that's in typescript we
// can update this to use those types.
export type SchemaFieldType = {
  name: string;
  path: string;
  probability: number;
  types: SchemaFieldType[];
  fields?: SchemaFieldType[];
  values?: any[];
  count?: number;
  has_duplicates?: boolean;
  lengths?: number[];
  average_length?: number;
  total_count?: number;
};

function ArraySubTypes({
  types,
  onSetTypeActive,
  activeType,
}: {
  types: SchemaFieldType[];
  onSetTypeActive: (
    type: SchemaFieldType & {
      isInArray?: boolean;
    }
  ) => void;
  activeType?: SchemaFieldType & {
    isInArray?: boolean;
  };
}) {
  /**
   * A subtype was clicked (in case of an Array type). Pass up to the Field
   * so the entire type bar can be re-rendered.
   */
  const subTypeClicked = useCallback(
    (subtype: SchemaFieldType) => {
      onSetTypeActive({
        ...subtype,
        // We append a flag to indicate the type is one of the types found in the array.
        isInArray: true,
      });
    },
    [onSetTypeActive]
  );

  // Sort the subtypes same as types (by probability, undefined last).
  const subtypes = useMemo(() => sortTypes(types), [types]);

  const activeSubType = find(
    subtypes,
    (subtype: SchemaFieldType) =>
      subtype.name === activeType?.name && activeType?.isInArray === true
  );

  return (
    <div data-testid="schema-field-type-list">
      {subtypes.map((subtype: SchemaFieldType) => (
        <FieldType
          key={`subtype-${subtype.name}`}
          activeType={activeSubType}
          onSetTypeActive={() => subTypeClicked(subtype)}
          type={subtype}
          types={subtype.types}
          typeName={subtype.name}
          probability={subtype.probability}
          // Don't show more sub types of nested arrays.
          showSubTypes={false}
        />
      ))}
    </div>
  );
}

const FieldLabel = ({ name }: { name: string }) => (
  <Disclaimer className={schemaFieldTypeLabelStyles}>{name}</Disclaimer>
);

type FieldTypeProps = {
  // name: string;
  types: SchemaFieldType[];
  activeType?: SchemaFieldType & {
    isInArray?: boolean;
  };
  type: SchemaFieldType;
  typeName: string;
  probability: number;
  onSetTypeActive: (type: SchemaFieldType) => void;
  showSubTypes: boolean;
};

function FieldType({
  type,
  typeName,
  types,
  activeType,
  probability,
  onSetTypeActive,
  showSubTypes,
}: FieldTypeProps) {
  /**
   * The type bar corresponding to this Type was clicked. Execute the
   * callback passed in from the parent (either <Field> or <Type> component
   * in case of subtypes).
   */
  const typeClicked = useCallback(
    (e) => {
      e.stopPropagation();
      if (typeName !== 'Undefined') {
        onSetTypeActive(type);
      }
    },
    [onSetTypeActive, type, typeName]
  );

  const tooltipText = useMemo(() => {
    // Show integer accuracy by default, but show one decimal point accuracy
    // when less than 1% or greater than 99% but no 0% or 100%.
    const format =
      (probability > 0.99 && probability < 1.0) ||
      (probability > 0 && probability < 0.01)
        ? '0.0%'
        : '0%';
    return `${typeName} (${numeral(probability).format(format)})`;
  }, [probability, typeName]);

  const isUndefined = typeName === 'Undefined';
  const isArray = typeName === 'Array';

  const isActiveType =
    typeName === activeType?.name && activeType?.isInArray !== true;

  return (
    <div
      className={cx(typeContainerStyles)}
      style={{
        width: `${probability * 100}%`,
      }}
    >
      <Tooltip
        trigger={({ children, ...props }) => (
          <button
            {...props}
            className={cx(
              fieldButtonStyles,
              isUndefined && fieldButtonUndefinedStyles
            )}
            onClick={typeClicked}
          >
            {showSubTypes ? <FieldLabel name={typeName} /> : null}
            <div
              className={cx(
                schemaFieldTypeBarStyles,
                isActiveType && schemaFieldTypeBarActiveStyles,
                isUndefined && schemaFieldTypeBarUndefinedStyles
              )}
            />
            {children}
          </button>
        )}
      >
        {tooltipText}
      </Tooltip>
      {/* Show one level of subtypes for arrays, 
          skip further arrays inside arrays. */}
      {isArray && showSubTypes && (
        <ArraySubTypes
          activeType={activeType}
          onSetTypeActive={onSetTypeActive}
          types={types}
        />
      )}

      <button
        className={cx(
          fieldButtonStyles,
          isUndefined && fieldButtonUndefinedStyles
        )}
        onClick={typeClicked}
      >
        {showSubTypes ? null : <FieldLabel name={typeName} />}
      </button>
    </div>
  );
}

export { FieldType };
