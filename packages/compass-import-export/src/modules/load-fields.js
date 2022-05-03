import util from 'util';
import dotnotation from '../utils/dotnotation';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { isInternalFieldPath } from 'hadron-document';

const { log, mongoLogId } = createLoggerAndTelemetry(
  'COMPASS-IMPORT-EXPORT-UI'
);

const DEFAULT_SAMPLE_SIZE = 50;
const ENABLED = 1;

function extractFieldsFromDocument(doc) {
  return Object.keys(dotnotation.serialize(doc));
}

function truncateFieldToDepth(field, depth) {
  if (!depth) {
    return field;
  }

  return field.split('.').slice(0, depth).join('.');
}

export async function loadFields(
  dataService,
  ns,
  { filter, sampleSize } = {},
  driverOptions = {}
) {
  const find = util.promisify(dataService.find.bind(dataService));
  sampleSize = sampleSize || DEFAULT_SAMPLE_SIZE;

  const docs = await find(ns, filter || {}, {
    limit: sampleSize,
    ...driverOptions,
  });

  const allFieldsSet = new Set();
  for (const doc of docs) {
    for (const field of extractFieldsFromDocument(doc)) {
      allFieldsSet.add(field);
    }
  }
  const allFields = [...allFieldsSet].sort();
  log.info(mongoLogId(1001000063), 'Export', 'Retrieved fields from sample', {
    allFields,
    sampleSize,
    filter,
  });
  return Object.fromEntries(allFields.map((field) => [field, ENABLED]));
}

export function getSelectableFields(fields, { maxDepth } = {}) {
  const selectableFields = Object.keys(fields).map((field) =>
    truncateFieldToDepth(field, maxDepth)
  );
  return Object.fromEntries(selectableFields.map((field) => {
    const enabled = !isInternalFieldPath(field);
    return [field, +enabled];
  }));
}
