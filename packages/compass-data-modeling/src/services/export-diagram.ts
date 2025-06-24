import type { StaticModel } from './data-model-storage';

export function exportToJson(fileName: string, model: StaticModel) {
  const json = getExportJsonFromModel(model);
  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: 'application/json',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    link.remove();
  }, 0);
}

export function getExportJsonFromModel({
  collections,
  relationships,
}: StaticModel) {
  return {
    collections: Object.fromEntries(
      collections.map((collection) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ns, jsonSchema, ...ignoredProps } = collection;
        return [ns, { ns, jsonSchema }];
      })
    ),
    relationships,
  };
}
