/**
 * Lives apart from `csv-utils` so that renderer-side callers can use it
 * without pulling in that module's `assert` dependency (and, once the import
 * logic moves to the utility process, the rest of the CSV machinery).
 */
export function csvHeaderNameToFieldName(name: string): string {
  return name.replace(/\[\d+\]/g, '[]');
}
