export const mapFieldToPropertyName = (field: string) => {
  // replace leading dollar and all dots
  return field.replace(/^\$/, '').replace(/\./g, '_');
};

export const mapFieldsToGroupId = (fields: string[]) => {
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