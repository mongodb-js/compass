import util from 'util';
import dotnotation from '../utils/dotnotation';

const DEFAULT_SAMPLE_SIZE = 50;
const ENABLED = 1;

function extractFieldsFromDocument(doc) {
  return Object.keys(dotnotation.serialize((doc)));
}

function truncateFieldToDepth(field, depth) {
  if (!depth) {
    return field;
  }

  return field
    .split('.')
    .slice(0, depth)
    .join('.');
}

export async function loadFields(
  dataService,
  ns,
  { filter, sampleSize } = {},
  driverOptions = {}
) {
  const find = util.promisify(dataService.find.bind(dataService));

  const docs = await find(ns, filter || {}, {
    limit: sampleSize || DEFAULT_SAMPLE_SIZE,
    ...driverOptions
  });

  const allFieldsSet = new Set();
  for (const doc of docs) {
    for (const field of extractFieldsFromDocument(doc)) {
      allFieldsSet.add(field);
    }
  }
  const allFields = [...allFieldsSet].sort();
  return Object.fromEntries(allFields.map(field => [field, ENABLED]));
}

export function getSelectableFields(fields, { maxDepth } = {}) {
  const selectableFields = Object.keys(fields)
    .map(field => truncateFieldToDepth(field, maxDepth));
  return Object.fromEntries(selectableFields.map(field => [field, ENABLED]));
}
