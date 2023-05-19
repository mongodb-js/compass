export const mapFieldToPropertyName = (field: string) => {
  // replace leading dollar and all dots
  return field.replace(/^\$/, '').replace(/\./g, '_');
};

export const mapFieldsToAccumulatorValue = (fields: string[]) => {
  if (fields.length === 0) {
    return null;
  }

  if (fields.length === 1) {
    return `$${fields[0]}`;
  }

  return Object.fromEntries(
    fields.map((x) => [mapFieldToPropertyName(x), `$${x}`])
  );
};

export const SORT_DIRECTION_OPTIONS = [
  {
    label: 'Ascending',
    value: 'Asc',
  },
  {
    label: 'Descending',
    value: 'Desc',
  },
] as const;

export type SortDirection = typeof SORT_DIRECTION_OPTIONS[number]['value'];

export const mapSortDataToStageValue = (
  data: {
    field: string;
    direction: SortDirection;
  }[]
): Record<string, number> => {
  return data.reduce<Record<string, number>>((acc, sort) => {
    if (sort.field) {
      acc[sort.field] = sort.direction === 'Asc' ? 1 : -1;
    }
    return acc;
  }, {});
};

let id = 0;
export const getNextId = () => id++;
