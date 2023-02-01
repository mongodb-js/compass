export function csvHeaderNameToFieldName(name: string) {
  return name.replace(/\[\d+\]/g, '');
}
