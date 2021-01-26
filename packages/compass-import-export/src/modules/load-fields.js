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

export default async function loadFields(
  dataService,
  ns,
  { filter, sampleSize, maxDepth } = {},
  driverOptions = {}
) {
  const find = util.promisify(dataService.find.bind(dataService));

  const docs = await find(ns, filter || {}, {
    limit: sampleSize || DEFAULT_SAMPLE_SIZE,
    ...driverOptions
  });

  const fieldsSet = docs.reduce((previousSet, doc) => {
    const fields = extractFieldsFromDocument(doc)
      .map(field => truncateFieldToDepth(field, maxDepth));

    return new Set([ ...previousSet, ...fields]);
  }, new Set());

  return Array
    .from(fieldsSet)
    .sort()
    .reduce((folded, field) => {
      return { ...folded, [field]: ENABLED };
    }, {});
}
